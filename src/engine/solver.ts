import {type Firing, type Puzzle} from './puzzle';
import {simulate} from './simulator';

export type SolverOptions = {
  maxNodes?: number; // default 100_000
};

export type SolverResult =
  | {solvable: true; firings: Firing[]}
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
): SolverResult {
  const maxNodes = options?.maxNodes ?? 100_000;
  const n = puzzle.sources.length;

  // Queue entries: arrays of source indices (ordered subset fired so far)
  const queue: Firing[][] = [[]];
  // Visited: keyed on the JSON representation of the firing sequence
  const visited = new Set<string>();
  visited.add('[]');

  let nodesExplored = 0;

  while (queue.length > 0) {
    if (nodesExplored >= maxNodes) {
      return {solvable: false};
    }

    const firings = queue.shift()!;
    nodesExplored++;

    // Check if current state is already solved (handles the empty-firing edge case)
    if (firings.length > 0) {
      const result = simulate(puzzle, firings);
      const solved = puzzle.targets.every((t, i) => result.targetsHit.get(i) === t.requires);
      if (solved) {
        return {solvable: true, firings};
      }

      // Pruning: if any target is painted the wrong colour, this branch is dead.
      // Wrong colour paint is irrecoverable (cells cannot be repainted).
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

    // Build set of already-fired indices for O(1) lookup
    const firedSet = new Set(firings.map(f => f.sourceIndex));

    // Expand: try appending each unfired source
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
