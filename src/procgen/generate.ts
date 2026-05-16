import {type Cell, type Direction, DIRECTIONS, distance, enumerateBoard, isInBoard} from '../engine/hex';
import {type Firing, type Puzzle, type Source, type Target} from '../engine/puzzle';
import {cellKey, simulate} from '../engine/simulator';
import {findAnySolution, solve, type SolverResult} from '../engine/solver';
import {makeRng, rngPick, rngSample, type Rng} from './rng';

export type GenerateParams = {
  boardRadius: number;
  sourceCount: number;
  targetCount: number;
  decoyCount?: number;
  antiTargetCount?: number;
  palette?: readonly string[];
  maxAttempts?: number;
};

const DEFAULT_PALETTE: readonly string[] = ['red', 'blue'];
const DEFAULT_MAX_ATTEMPTS = 1000;
const ORIGIN: Cell = {q: 0, r: 0};

function inwardDirections(cell: Cell, boardRadius: number): Direction[] {
  return (Object.keys(DIRECTIONS) as Direction[]).filter(dir => {
    const d = DIRECTIONS[dir];
    return isInBoard({q: cell.q + d.q, r: cell.r + d.r}, boardRadius);
  });
}

const MAX_DECOY_ATTEMPTS = 200;

function addDecoys(
  skeleton: Puzzle,
  skeletonResult: Extract<SolverResult, {solvable: true}>,
  decoyCount: number,
  borderCells: Cell[],
  rng: Rng,
): Puzzle | null {
  const usedCellKeys = new Set(skeleton.sources.map(s => cellKey(s.cell)));
  let current = skeleton;

  for (let d = 0; d < decoyCount; d++) {
    let placed = false;

    for (let attempt = 0; attempt < MAX_DECOY_ATTEMPTS; attempt++) {
      const available = borderCells.filter(c => !usedCellKeys.has(cellKey(c)));
      if (available.length === 0) return null;

      const cell = rngPick(rng, available);
      const dirs = inwardDirections(cell, current.boardRadius);
      if (dirs.length === 0) continue;

      const direction = rngPick(rng, dirs);
      const color = rngPick(rng, current.palette);
      const decorated: Puzzle = {
        ...current,
        sources: [...current.sources, {cell, color, direction} satisfies Source],
      };

      const decoratedResult = solve(decorated);
      if (!decoratedResult.solvable) continue;

      // Canonical must be identical and no new solutions introduced.
      const sameLength = decoratedResult.canonical.length === skeletonResult.canonical.length;
      const sameIndices =
        sameLength &&
        decoratedResult.canonical.every(
          (f, i) => f.sourceIndex === skeletonResult.canonical[i].sourceIndex,
        );
      if (!sameIndices || decoratedResult.alternateCount !== skeletonResult.alternateCount) continue;

      usedCellKeys.add(cellKey(cell));
      current = decorated;
      placed = true;
      break;
    }

    if (!placed) return null;
  }

  return current;
}

function addAntiTargets(
  puzzle: Puzzle,
  antiTargetCount: number,
  rng: Rng,
): Puzzle | null {
  // Cells traversed by canonical beams — anti-targets must not intersect these.
  const canonicalPainted = simulate(puzzle, puzzle.canonicalSolution.firings).paintedCells;

  // All cells any source can reach on an unobstructed board.
  const naked: Puzzle = {...puzzle, targets: [], antiTargets: []};
  const allSourceFirings: Firing[] = puzzle.sources.map((_, i) => ({sourceIndex: i}));
  const allPainted = simulate(naked, allSourceFirings).paintedCells;

  const occupiedKeys = new Set([
    ...puzzle.sources.map(s => cellKey(s.cell)),
    ...puzzle.targets.map(t => cellKey(t.cell)),
  ]);

  // Candidates: reachable by some beam, outside the canonical path, not already occupied.
  const candidates = [...allPainted.keys()].filter(
    k => !canonicalPainted.has(k) && !occupiedKeys.has(k),
  );

  if (candidates.length < antiTargetCount) return null;

  const antiTargets = rngSample(rng, candidates, antiTargetCount).map(key => {
    const [q, r] = key.split(',').map(Number);
    return {cell: {q, r}};
  });

  const decorated: Puzzle = {...puzzle, antiTargets};

  // Safety net: canonical must not paint any anti-target once they're placed.
  const validationSim = simulate(decorated, decorated.canonicalSolution.firings);
  if (validationSim.antiTargetsPainted.size > 0) return null;

  return decorated;
}

function tryGenerate(
  params: GenerateParams,
  rng: Rng,
  seed: number,
  attemptIndex: number,
): Puzzle | null {
  const {boardRadius, sourceCount, targetCount} = params;
  const palette = params.palette ?? DEFAULT_PALETTE;

  const borderCells = enumerateBoard(boardRadius).filter(
    c => distance(c, ORIGIN) === boardRadius,
  );

  if (borderCells.length < sourceCount) return null;

  const sourceCells = rngSample(rng, borderCells, sourceCount);

  const sources: Source[] = [];
  for (const cell of sourceCells) {
    const dirs = inwardDirections(cell, boardRadius);
    if (dirs.length === 0) return null;
    const direction = rngPick(rng, dirs);
    const color = rngPick(rng, palette);
    sources.push({cell, color, direction});
  }

  // Simulate all sources on a target-free board to find reachable painted cells.
  const tempPuzzle: Puzzle = {
    id: 'temp',
    boardRadius,
    palette: [...palette],
    sources,
    targets: [],
    antiTargets: [],
    prisms: [],
    canonicalSolution: {firings: [], length: 0},
    difficulty: {tier: 'easy', score: 0},
  };

  const allFirings: Firing[] = sources.map((_, i) => ({sourceIndex: i}));
  const tempSim = simulate(tempPuzzle, allFirings);

  const sourceCellKeys = new Set(sources.map(s => cellKey(s.cell)));
  const candidateTargets = [...tempSim.paintedCells.entries()].filter(
    ([k]) => !sourceCellKeys.has(k),
  );

  if (candidateTargets.length < targetCount) return null;

  const sampled = rngSample(rng, candidateTargets, targetCount);
  const targets: Target[] = sampled.map(([key, color]) => {
    const [q, r] = key.split(',').map(Number);
    return {cell: {q, r}, requires: color};
  });

  const puzzle: Puzzle = {
    id: `procgen-${seed}-${attemptIndex}`,
    boardRadius,
    palette: [...palette],
    sources,
    targets,
    antiTargets: [],
    prisms: [],
    canonicalSolution: {firings: allFirings, length: allFirings.length},
    difficulty: {tier: 'easy', score: 0},
  };

  // Verify the intended sequence actually solves the puzzle in the real simulation
  // (targets stop beams, so the no-target sim may differ from the actual sim).
  const actualSim = simulate(puzzle, allFirings);
  const intendedSolves = targets.every((t, i) => actualSim.targetsHit.get(i) === t.requires);
  if (!intendedSolves) return null;

  // Final gate: solver confirms solvability.
  const solverResult = findAnySolution(puzzle);
  if (!solverResult.solvable) return null;

  const decoyCount = params.decoyCount ?? 0;
  const antiTargetCount = params.antiTargetCount ?? 0;

  let current: Puzzle = puzzle;

  if (decoyCount > 0) {
    const skeletonResult = solve(puzzle);
    if (!skeletonResult.solvable) return null;
    const withDecoys = addDecoys(puzzle, skeletonResult, decoyCount, borderCells, rng);
    if (withDecoys === null) return null;
    current = withDecoys;
  }

  if (antiTargetCount > 0) {
    const withAntiTargets = addAntiTargets(current, antiTargetCount, rng);
    if (withAntiTargets === null) return null;
    current = withAntiTargets;
  }

  return current;
}

export function generate(params: GenerateParams, rngSeed: number): Puzzle {
  const maxAttempts = params.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const rng = makeRng(rngSeed);

  for (let i = 0; i < maxAttempts; i++) {
    const puzzle = tryGenerate(params, rng, rngSeed, i);
    if (puzzle !== null) return puzzle;
  }

  throw new Error(
    `generate: no valid puzzle after ${maxAttempts} attempts ` +
      `(seed=${rngSeed}, sourceCount=${params.sourceCount}, targetCount=${params.targetCount})`,
  );
}
