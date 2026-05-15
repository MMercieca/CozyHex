import {type Cell, type Direction, DIRECTIONS, isInBoard} from './hex';
import {type Colour, type Puzzle, type Firing, type PrismBend} from './puzzle';

export type CellKey = string;

export function cellKey(cell: Cell): CellKey {
  return `${cell.q},${cell.r}`;
}

export type SimulationResult = {
  readonly paintedCells: ReadonlyMap<CellKey, Colour>;
  readonly targetsHit: ReadonlyMap<number, Colour>; // target index → colour it was painted
  readonly antiTargetsPainted: ReadonlySet<number>; // anti-target indices painted
  readonly f1: boolean; // all sources fired, targets not all correctly painted
};

type PathEntry =
  | {type: 'neutral'; cell: Cell}
  | {type: 'target'; cell: Cell; targetIndex: number}
  | {type: 'antiTarget'; cell: Cell; antiTargetIndex: number};

// Clockwise direction order for P-bend rotation
const CW_DIRS: Direction[] = ['E', 'SE', 'SW', 'W', 'NW', 'NE'];

export function rotateCW(direction: Direction, turns: number): Direction {
  const idx = CW_DIRS.indexOf(direction);
  return CW_DIRS[((idx + turns) % 6 + 6) % 6];
}

function step(cell: Cell, direction: Direction): Cell {
  const d = DIRECTIONS[direction];
  return {q: cell.q + d.q, r: cell.r + d.r};
}

function buildCellIndex<T>(
  items: readonly T[],
  getCell: (item: T) => Cell,
): Map<CellKey, number> {
  const map = new Map<CellKey, number>();
  items.forEach((item, i) => map.set(cellKey(getCell(item)), i));
  return map;
}

function computePath(
  puzzle: Puzzle,
  sourceIndex: number,
  paintedCells: Map<CellKey, Colour>,
  sourceAt: Map<CellKey, number>,
  targetAt: Map<CellKey, number>,
  antiTargetAt: Map<CellKey, number>,
  prismBendAt: Map<CellKey, number>,
): {path: PathEntry[]; colour: Colour} {
  const source = puzzle.sources[sourceIndex];
  const colour = source.color;
  const path: PathEntry[] = [];
  const visited = new Set<CellKey>();

  let dir: Direction = source.direction;
  let cell = step(source.cell, dir);

  while (true) {
    if (!isInBoard(cell, puzzle.boardRadius)) break; // edge exit

    const key = cellKey(cell);

    if (visited.has(key)) break; // loop guard (e.g. prism ring)
    visited.add(key);

    if (paintedCells.has(key)) break; // painted tile blocks beam

    // Source cells are transparent; beam passes through without painting
    if (sourceAt.has(key)) {
      cell = step(cell, dir);
      continue;
    }

    // P-bend prism: redirect, do not paint
    const prismIdx = prismBendAt.get(key);
    if (prismIdx !== undefined) {
      const prism = puzzle.prisms[prismIdx] as PrismBend;
      dir = rotateCW(dir, prism.turns);
      cell = step(cell, dir);
      continue;
    }

    const tIdx = targetAt.get(key);
    if (tIdx !== undefined) {
      path.push({type: 'target', cell, targetIndex: tIdx});
      break;
    }

    const aIdx = antiTargetAt.get(key);
    if (aIdx !== undefined) {
      path.push({type: 'antiTarget', cell, antiTargetIndex: aIdx});
      break;
    }

    path.push({type: 'neutral', cell});
    cell = step(cell, dir);
  }

  return {path, colour};
}

export function simulate(puzzle: Puzzle, firings: readonly Firing[]): SimulationResult {
  const paintedCells = new Map<CellKey, Colour>();
  const targetsHit = new Map<number, Colour>();
  const antiTargetsPainted = new Set<number>();

  const sourceAt = buildCellIndex(puzzle.sources, s => s.cell);
  const targetAt = buildCellIndex(puzzle.targets, t => t.cell);
  const antiTargetAt = buildCellIndex(puzzle.antiTargets, a => a.cell);
  const prismBendAt = new Map<CellKey, number>();
  puzzle.prisms.forEach((p, i) => {
    if (p.type === 'bend') prismBendAt.set(cellKey(p.cell), i);
  });

  for (const firing of firings) {
    const {path, colour} = computePath(
      puzzle,
      firing.sourceIndex,
      paintedCells,
      sourceAt,
      targetAt,
      antiTargetAt,
      prismBendAt,
    );

    // Atomic: commit all paint after full path is computed
    for (const entry of path) {
      paintedCells.set(cellKey(entry.cell), colour);
      if (entry.type === 'target') {
        targetsHit.set(entry.targetIndex, colour);
      } else if (entry.type === 'antiTarget') {
        antiTargetsPainted.add(entry.antiTargetIndex);
      }
    }
  }

  const firedSources = new Set(firings.map(f => f.sourceIndex));
  const allSourcesFired = puzzle.sources.every((_, i) => firedSources.has(i));
  const solved = puzzle.targets.every((t, i) => targetsHit.get(i) === t.requires);
  const f1 = allSourcesFired && !solved;

  return {paintedCells, targetsHit, antiTargetsPainted, f1};
}
