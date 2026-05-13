import {
  DIRECTIONS,
  Cell,
  neighbours,
  distance,
  isInBoard,
  enumerateBoard,
} from '../src/engine/hex';

// ── DIRECTIONS ────────────────────────────────────────────────────────────────

describe('DIRECTIONS', () => {
  test('all six vectors are defined per DESIGN.md §3.2', () => {
    expect(DIRECTIONS.E).toEqual({q: 1, r: 0});
    expect(DIRECTIONS.NE).toEqual({q: 1, r: -1});
    expect(DIRECTIONS.NW).toEqual({q: 0, r: -1});
    expect(DIRECTIONS.W).toEqual({q: -1, r: 0});
    expect(DIRECTIONS.SW).toEqual({q: -1, r: 1});
    expect(DIRECTIONS.SE).toEqual({q: 0, r: 1});
  });

  test('exactly six directions', () => {
    expect(Object.keys(DIRECTIONS)).toHaveLength(6);
  });
});

// ── neighbours ────────────────────────────────────────────────────────────────

describe('neighbours', () => {
  test('origin has six neighbours', () => {
    expect(neighbours({q: 0, r: 0})).toHaveLength(6);
  });

  test('neighbours of origin match the six direction vectors', () => {
    const ns = neighbours({q: 0, r: 0});
    expect(ns).toContainEqual({q: 1, r: 0});
    expect(ns).toContainEqual({q: 1, r: -1});
    expect(ns).toContainEqual({q: 0, r: -1});
    expect(ns).toContainEqual({q: -1, r: 0});
    expect(ns).toContainEqual({q: -1, r: 1});
    expect(ns).toContainEqual({q: 0, r: 1});
  });

  test('neighbours of an off-centre cell are offset correctly', () => {
    const ns = neighbours({q: 2, r: -1});
    expect(ns).toContainEqual({q: 3, r: -1}); // E
    expect(ns).toContainEqual({q: 2, r: 0});  // SE
    expect(ns).toContainEqual({q: 1, r: 0});  // W+1
  });
});

// ── distance ─────────────────────────────────────────────────────────────────

describe('distance', () => {
  test('distance from a cell to itself is 0', () => {
    expect(distance({q: 0, r: 0}, {q: 0, r: 0})).toBe(0);
    expect(distance({q: 2, r: -3}, {q: 2, r: -3})).toBe(0);
  });

  test('adjacent cells are distance 1', () => {
    expect(distance({q: 0, r: 0}, {q: 1, r: 0})).toBe(1);
    expect(distance({q: 0, r: 0}, {q: 0, r: 1})).toBe(1);
    expect(distance({q: 0, r: 0}, {q: -1, r: 1})).toBe(1);
  });

  test('distance is symmetric', () => {
    const a: Cell = {q: 2, r: -1};
    const b: Cell = {q: -1, r: 3};
    expect(distance(a, b)).toBe(distance(b, a));
  });

  test('known distances', () => {
    expect(distance({q: 0, r: 0}, {q: 2, r: -2})).toBe(2);
    expect(distance({q: 0, r: 0}, {q: 2, r: 0})).toBe(2);
    expect(distance({q: 0, r: 0}, {q: -3, r: 3})).toBe(3);
  });
});

// ── isInBoard ─────────────────────────────────────────────────────────────────

describe('isInBoard', () => {
  test('origin is always in board', () => {
    expect(isInBoard({q: 0, r: 0}, 2)).toBe(true);
    expect(isInBoard({q: 0, r: 0}, 3)).toBe(true);
    expect(isInBoard({q: 0, r: 0}, 4)).toBe(true);
  });

  test('cells at exactly radius R are included', () => {
    expect(isInBoard({q: 2, r: 0}, 2)).toBe(true);
    expect(isInBoard({q: 0, r: -2}, 2)).toBe(true);
    expect(isInBoard({q: -2, r: 2}, 2)).toBe(true);
  });

  test('cells beyond radius R are excluded', () => {
    expect(isInBoard({q: 3, r: 0}, 2)).toBe(false);
    expect(isInBoard({q: 2, r: 2}, 2)).toBe(false);
    expect(isInBoard({q: -3, r: 3}, 2)).toBe(false);
  });

  test('radius 3 boundary', () => {
    expect(isInBoard({q: 3, r: -3}, 3)).toBe(true);
    expect(isInBoard({q: 4, r: -3}, 3)).toBe(false);
  });
});

// ── enumerateBoard ────────────────────────────────────────────────────────────

describe('enumerateBoard', () => {
  test('R=2 yields 19 cells', () => {
    expect(enumerateBoard(2)).toHaveLength(19);
  });

  test('R=3 yields 37 cells', () => {
    expect(enumerateBoard(3)).toHaveLength(37);
  });

  test('R=4 yields 61 cells', () => {
    expect(enumerateBoard(4)).toHaveLength(61);
  });

  test('all returned cells are within the board', () => {
    for (const radius of [2, 3, 4]) {
      for (const cell of enumerateBoard(radius)) {
        expect(isInBoard(cell, radius)).toBe(true);
      }
    }
  });

  test('no duplicate cells', () => {
    for (const radius of [2, 3, 4]) {
      const cells = enumerateBoard(radius);
      const keys = new Set(cells.map(c => `${c.q},${c.r}`));
      expect(keys.size).toBe(cells.length);
    }
  });

  test('origin is always included', () => {
    for (const radius of [2, 3, 4]) {
      expect(enumerateBoard(radius)).toContainEqual({q: 0, r: 0});
    }
  });
});
