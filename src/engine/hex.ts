// Axial-coordinate hex grid math. Pure functions, no side effects.
// Directions per DESIGN.md §3.2: E (+1,0), NE (+1,-1), NW (0,-1), W (-1,0), SW (-1,+1), SE (0,+1)

export type Cell = {readonly q: number; readonly r: number};

export type Direction = 'E' | 'NE' | 'NW' | 'W' | 'SW' | 'SE';

export const DIRECTIONS: Record<Direction, Cell> = {
  E:  {q:  1, r:  0},
  NE: {q:  1, r: -1},
  NW: {q:  0, r: -1},
  W:  {q: -1, r:  0},
  SW: {q: -1, r:  1},
  SE: {q:  0, r:  1},
};

export function neighbours(cell: Cell): Cell[] {
  return (Object.values(DIRECTIONS) as Cell[]).map(d => ({
    q: cell.q + d.q,
    r: cell.r + d.r,
  }));
}

export function distance(a: Cell, b: Cell): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
}

export function isInBoard(cell: Cell, radius: number): boolean {
  return distance(cell, {q: 0, r: 0}) <= radius;
}

export function enumerateBoard(radius: number): Cell[] {
  const cells: Cell[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (isInBoard({q, r}, radius)) {
        cells.push({q, r});
      }
    }
  }
  return cells;
}
