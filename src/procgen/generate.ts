import {type Cell, type Direction, DIRECTIONS, distance, enumerateBoard, isInBoard} from '../engine/hex';
import {type Firing, type Puzzle, type Source, type Target} from '../engine/puzzle';
import {cellKey, simulate} from '../engine/simulator';
import {findAnySolution} from '../engine/solver';
import {makeRng, rngPick, rngSample, type Rng} from './rng';

export type GenerateParams = {
  boardRadius: number;
  sourceCount: number;
  targetCount: number;
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

  return puzzle;
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
