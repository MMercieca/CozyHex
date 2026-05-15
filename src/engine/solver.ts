import {type Firing, type Puzzle} from './puzzle';
import {simulate} from './simulator';

export type SolverOptions = {
  maxNodes?: number; // default 100_000
};

// Used only by findAnySolution — stops at first valid solution.
export type FindAnyResult =
  | {solvable: true; firings: Firing[]}
  | {solvable: false};

// Returned by solve() — exhaustive search with canonical selection.
export type SolverResult =
  | {solvable: true; canonical: Firing[]; length: number; alternateCount: number; elegantUnique: boolean}
  | {solvable: false};

/**
 * BFS over ordered subsets of sources to find any firing sequence that solves
 * the puzzle (every target painted its required colour).
 *
 * State: ordered list of source indices fired so far.
 * Transitions: append any source not yet in the current sequence.
 * Pruning: skip states where a target is already painted the wrong colour
 * (irrecoverable), or where the same ordered subset has been visited.
 * Budget cap: stop (solvable: false) after maxNodes states explored.
 */
export function findAnySolution(
  puzzle: Puzzle,
  options?: SolverOptions,
): FindAnyResult {
  const maxNodes = options?.maxNodes ?? 100_000;
  const n = puzzle.sources.length;

  const queue: Firing[][] = [[]];
  const visited = new Set<string>();
  visited.add('[]');

  let nodesExplored = 0;

  while (queue.length > 0) {
    if (nodesExplored >= maxNodes) {
      return {solvable: false};
    }

    const firings = queue.shift()!;
    nodesExplored++;

    if (firings.length > 0) {
      const result = simulate(puzzle, firings);
      const solved = puzzle.targets.every((t, i) => result.targetsHit.get(i) === t.requires);
      if (solved) {
        return {solvable: true, firings};
      }

      let deadEnd = false;
      for (let i = 0; i < puzzle.targets.length; i++) {
        const painted = result.targetsHit.get(i);
        if (painted !== undefined && painted !== puzzle.targets[i].requires) {
          deadEnd = true;
          break;
        }
      }
      if (deadEnd) continue;
    }

    const firedSet = new Set(firings.map(f => f.sourceIndex));

    for (let i = 0; i < n; i++) {
      if (firedSet.has(i)) continue;

      const next: Firing[] = [...firings, {sourceIndex: i}];
      const key = JSON.stringify(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return {solvable: false};
}

// Sum of perpendicular distances from each painted cell to all 6 hex symmetry
// axes (passing through origin). Lower = more symmetric.
// Axes at 0°, 30°, 60°, 90°, 120°, 150° in Cartesian hex space.
// Hex Cartesian: x = q + r*0.5, y = r*(sqrt(3)/2)
function symmetryScore(paintedCells: Map<string, string>): number {
  const SQRT3_2 = Math.sqrt(3) / 2;
  // Unit normals for the 6 axes (each axis defined by angle θ; normal is perpendicular)
  const axes: Array<{nx: number; ny: number}> = [
    {nx: 0, ny: 1},          // axis at 0° (horizontal), normal is vertical
    {nx: Math.cos(Math.PI / 6), ny: -Math.sin(Math.PI / 6)},  // axis at 30°
    {nx: Math.cos(Math.PI / 3), ny: -Math.sin(Math.PI / 3)},  // axis at 60°
    {nx: 1, ny: 0},           // axis at 90° (vertical), normal is horizontal
    {nx: Math.cos(2 * Math.PI / 3), ny: -Math.sin(2 * Math.PI / 3)}, // 120°
    {nx: Math.cos(5 * Math.PI / 6), ny: -Math.sin(5 * Math.PI / 6)}, // 150°
  ];

  let total = 0;
  for (const key of paintedCells.keys()) {
    const [qs, rs] = key.split(',');
    const q = parseInt(qs, 10);
    const r = parseInt(rs, 10);
    const x = q + r * 0.5;
    const y = r * SQRT3_2;
    for (const {nx, ny} of axes) {
      total += Math.abs(x * nx + y * ny); // perpendicular distance to axis
    }
  }
  return total;
}

function isSolved(puzzle: Puzzle, firings: Firing[]): boolean {
  if (firings.length === 0) return false;
  const result = simulate(puzzle, firings);
  return puzzle.targets.every((t, i) => result.targetsHit.get(i) === t.requires);
}

function getPaintedCells(puzzle: Puzzle, firings: Firing[]): Map<string, string> {
  return simulate(puzzle, firings).paintedCells;
}

/**
 * Exhaustive BFS over all valid firing sequences. Returns the elegant
 * canonical solution (shortest, symmetry tiebreak) and total solution count.
 */
export function solve(puzzle: Puzzle, options?: SolverOptions): SolverResult {
  const maxNodes = options?.maxNodes ?? 100_000;
  const n = puzzle.sources.length;

  const queue: Firing[][] = [[]];
  const visited = new Set<string>();
  visited.add('[]');

  let nodesExplored = 0;
  const solutions: Firing[][] = [];
  let shortestLength = Infinity;

  while (queue.length > 0) {
    if (nodesExplored >= maxNodes) {
      return {solvable: false};
    }

    const firings = queue.shift()!;
    nodesExplored++;

    // Prune: longer than shortest solution found so far
    if (firings.length > shortestLength) continue;

    if (firings.length > 0) {
      const result = simulate(puzzle, firings);
      const solved = puzzle.targets.every((t, i) => result.targetsHit.get(i) === t.requires);

      if (solved) {
        solutions.push(firings);
        if (firings.length < shortestLength) {
          shortestLength = firings.length;
        }
        // Don't expand further from a solved state
        continue;
      }

      let deadEnd = false;
      for (let i = 0; i < puzzle.targets.length; i++) {
        const painted = result.targetsHit.get(i);
        if (painted !== undefined && painted !== puzzle.targets[i].requires) {
          deadEnd = true;
          break;
        }
      }
      if (deadEnd) continue;
    }

    if (firings.length >= shortestLength) continue;

    const firedSet = new Set(firings.map(f => f.sourceIndex));

    for (let i = 0; i < n; i++) {
      if (firedSet.has(i)) continue;

      const next: Firing[] = [...firings, {sourceIndex: i}];
      const key = JSON.stringify(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  if (solutions.length === 0) return {solvable: false};

  // Among shortest solutions, apply symmetry tiebreak
  const shortest = solutions.filter(s => s.length === shortestLength);
  const scored = shortest.map(s => ({
    firings: s,
    score: symmetryScore(getPaintedCells(puzzle, s)),
  }));
  scored.sort((a, b) => a.score - b.score);

  const bestScore = scored[0].score;
  const canonical = scored[0].firings;
  const elegantUnique = scored.filter(s => s.score === bestScore).length === 1;

  return {
    solvable: true,
    canonical,
    length: shortestLength,
    alternateCount: solutions.length,
    elegantUnique,
  };
}
