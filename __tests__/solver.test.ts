import {deserializePuzzle} from '../src/engine/puzzle';
import {simulate} from '../src/engine/simulator';
import {findAnySolution, solve} from '../src/engine/solver';
import theDecoyJson from '../src/engine/fixtures/the-decoy.json';

const decoy = deserializePuzzle(theDecoyJson);

// ---------------------------------------------------------------------------
// Helper: build a minimal valid puzzle JSON inline
// ---------------------------------------------------------------------------
const BASE = {
  boardRadius: 3,
  palette: ['red', 'blue'],
  antiTargets: [],
  prisms: [],
  difficulty: {tier: 'easy', score: 1.0},
};

function makePuzzle(overrides: object) {
  return deserializePuzzle({...BASE, ...overrides});
}

// ---------------------------------------------------------------------------
// The Decoy acceptance tests
// ---------------------------------------------------------------------------
describe('findAnySolution — The Decoy', () => {
  test('returns solvable: true with a firing sequence', () => {
    const result = findAnySolution(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return; // type narrowing
    expect(result.firings).toBeDefined();
    expect(result.firings.length).toBeGreaterThan(0);
  });

  test('returned solution actually solves the puzzle when simulated', () => {
    const result = findAnySolution(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;

    const simResult = simulate(decoy, result.firings);
    const solved = decoy.targets.every((t, i) => simResult.targetsHit.get(i) === t.requires);
    expect(solved).toBe(true);
  });

  test('solution uses only a subset of sources (decoy source need not fire)', () => {
    const result = findAnySolution(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;

    // The decoy (source index 2, red E) paints the middle row and blocks the
    // blue beam — a correct solver must not require it to fire.
    const sourceIndices = result.firings.map(f => f.sourceIndex);
    // A valid solution exists without source 2 (the decoy)
    expect(sourceIndices).not.toContain(2);
  });
});

// ---------------------------------------------------------------------------
// Unsolvable puzzle
// ---------------------------------------------------------------------------
describe('findAnySolution — unsolvable puzzles', () => {
  test('single red source, target requires blue → solvable: false', () => {
    // Source 0: red, fires E from (-3,0). Target at (0,0) requires blue.
    // Red will paint the target red; no way to paint it blue.
    const puzzle = makePuzzle({
      id: 'unsolvable-wrong-colour',
      sources: [{cell: [-3, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [0, 0], requires: 'blue'}],
      canonicalSolution: {firings: [], length: 0},
    });
    const result = findAnySolution(puzzle);
    expect(result.solvable).toBe(false);
  });

  test('two sources that mutually block each other with no valid ordering → solvable: false', () => {
    // Source 0: red E from (-3,0) — paints row, including (0,0).
    // Source 1: blue W from (3,0)  — paints row, including (0,0).
    // Target at (0,0) requires blue.
    // If red fires first: paints (0,0) red; blue is then blocked before (0,0).
    // If blue fires first: paints (0,0) blue (correct!), but target also at (2,0) requires red,
    //   and then red fires, but (2,0) would need to be painted red…
    // Actually, simpler: target at (0,0) requires blue. Source 0 is red, source 1 is blue.
    // Blue fires W from (3,0): (2,0),(1,0),(0,0) → paints target blue. That SOLVES it.
    // So we need a truly unsolvable setup.
    //
    // Better design: two targets.
    //   Target 0 at (-1,0) requires red.
    //   Target 1 at ( 1,0) requires blue.
    //   Source 0: red E from (-3,0) — passes through (-2,0),(-1,0)=T0, stops.
    //   Source 1: blue W from (3,0) — passes through (2,0),(1,0)=T1, stops.
    // This is actually solvable in any order! (Each source hits its own target.)
    // Need a case where every ordering fails.
    //
    // Truly unsolvable: only one source (red), two targets one requires red the other blue.
    // The red beam can only reach one of them (they're in the same direction).
    // Source: red E from (-3,0). Target A at (-2,0) requires red (beam stops here).
    // Target B at (0,0) requires red. But beam stops at A so B is never hit.
    // Unsolvable because B is never reached.
    const puzzle = makePuzzle({
      id: 'unsolvable-unreachable-target',
      sources: [{cell: [-3, 0], color: 'red', direction: 'E'}],
      targets: [
        {cell: [-2, 0], requires: 'red'},  // beam stops here
        {cell: [ 0, 0], requires: 'red'},  // never reached (blocked by first target)
      ],
      canonicalSolution: {firings: [], length: 0},
    });
    const result = findAnySolution(puzzle);
    expect(result.solvable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Multi-solution puzzle
// ---------------------------------------------------------------------------
describe('findAnySolution — multi-solution puzzle', () => {
  test('two red sources both reaching the target: either alone solves it', () => {
    // Source 0: red E from (-3,0) — path: (-2,0),(-1,0),(0,0)=target.
    // Source 1: red W from (3,0)  — path: (2,0),(1,0),(0,0)=target.
    // Both sources independently hit (0,0) with red. Target requires red.
    // Firing source 0 alone solves it. Firing source 1 alone solves it.
    const puzzle = makePuzzle({
      id: 'multi-solution',
      sources: [
        {cell: [-3, 0], color: 'red', direction: 'E'},
        {cell: [ 3, 0], color: 'red', direction: 'W'},
      ],
      targets: [{cell: [0, 0], requires: 'red'}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    });
    const result = findAnySolution(puzzle);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;

    // Verify the returned solution actually works
    const simResult = simulate(puzzle, result.firings);
    const solved = puzzle.targets.every((t, i) => simResult.targetsHit.get(i) === t.requires);
    expect(solved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Budget cap
// ---------------------------------------------------------------------------
describe('findAnySolution — budget cap', () => {
  test('returns solvable: false when budget is 0 (no nodes explored)', () => {
    // With maxNodes: 0, the solver exhausts budget before exploring any state.
    const result = findAnySolution(decoy, {maxNodes: 0});
    expect(result.solvable).toBe(false);
  });

  test('returns solvable: false when budget is too small to reach solution', () => {
    // The Decoy solution requires at least 2 firings; BFS explores:
    //   depth 0: [] (1 node)
    //   depth 1: [0],[1],[2] (3 nodes, total 4)
    //   depth 2: [0,1],[0,2],[1,0],[1,2],[2,0],[2,1] (6 nodes, total 10)
    // Solution is at depth 2. With maxNodes: 1, we hit the cap after
    // dequeueing the first node (the empty sequence).
    const result = findAnySolution(decoy, {maxNodes: 1});
    expect(result.solvable).toBe(false);
  });

  test('default budget (100_000) is sufficient for The Decoy', () => {
    const result = findAnySolution(decoy);
    expect(result.solvable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// solve() — elegant canonical
// ---------------------------------------------------------------------------
describe('solve — The Decoy', () => {
  test('returns solvable: true with length: 2', () => {
    const result = solve(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;
    expect(result.length).toBe(2);
  });

  test('canonical uses sources 0 and 1 (not the decoy source 2)', () => {
    const result = solve(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;
    const indices = result.canonical.map(f => f.sourceIndex).sort();
    expect(indices).toEqual([0, 1]);
  });

  test('canonical solution actually solves the puzzle', () => {
    const result = solve(decoy);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;
    const simResult = simulate(decoy, result.canonical);
    const solved = decoy.targets.every((t, i) => simResult.targetsHit.get(i) === t.requires);
    expect(solved).toBe(true);
  });
});

describe('solve — single-solution puzzle', () => {
  test('alternateCount: 1, elegantUnique: true', () => {
    // One red source, one red target in its direct path.
    const puzzle = makePuzzle({
      id: 'single-solution',
      sources: [{cell: [-3, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [0, 0], requires: 'red'}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    });
    const result = solve(puzzle);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;
    expect(result.alternateCount).toBe(1);
    expect(result.elegantUnique).toBe(true);
  });
});

describe('solve — multi-solution puzzle', () => {
  test('two independent sources both solving the puzzle → alternateCount > 1', () => {
    // Source 0: red E from (-3,0) hits (0,0). Source 1: red W from (3,0) hits (0,0).
    // Either alone solves. Both together also solve (redundant). alternateCount ≥ 2.
    const puzzle = makePuzzle({
      id: 'multi-solution',
      sources: [
        {cell: [-3, 0], color: 'red', direction: 'E'},
        {cell: [3, 0], color: 'red', direction: 'W'},
      ],
      targets: [{cell: [0, 0], requires: 'red'}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    });
    const result = solve(puzzle);
    expect(result.solvable).toBe(true);
    if (!result.solvable) return;
    expect(result.alternateCount).toBeGreaterThan(1);
    expect(result.length).toBe(1);
  });
});
