import {deserializePuzzle} from '../src/engine/puzzle';
import {simulate, cellKey, rotateCW} from '../src/engine/simulator';
import type {Direction} from '../src/engine/hex';

// ── rotateCW ────────────────────────────────────────────────────────────────

describe('rotateCW', () => {
  const cases: [Direction, Direction][] = [
    ['E',  'SE'],
    ['SE', 'SW'],
    ['SW', 'W'],
    ['W',  'NW'],
    ['NW', 'NE'],
    ['NE', 'E'],
  ];
  test.each(cases)('%s 60° CW → %s', (from, to) => {
    expect(rotateCW(from, 1)).toBe(to);
  });

  test('2 turns CW = 120°', () => {
    expect(rotateCW('E', 2)).toBe('SW');
  });

  test('6 turns = full rotation = identity', () => {
    expect(rotateCW('NE', 6)).toBe('NE');
  });

  test('negative turns rotate counter-clockwise', () => {
    expect(rotateCW('E', -1)).toBe('NE'); // E CCW = NE
  });
});

// ── P-bend prism simulator tests ─────────────────────────────────────────────

const base = {
  id: 'prism-test',
  boardRadius: 3,
  palette: ['red'],
  sources: [{cell: [-3, 0], color: 'red', direction: 'E'}],
  targets: [],
  antiTargets: [],
  canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
  difficulty: {tier: 'easy', score: 1.0},
};

describe('P-bend prism — single prism', () => {
  // Source fires E from (-3,0): beam starts at (-2,0).
  // Prism at (0,0) turns:1 → bends E to SE.
  // After prism: (0,1),(0,2),(0,3) then off-board.
  const puzzle = deserializePuzzle({
    ...base,
    prisms: [{type: 'bend', cell: [0, 0], turns: 1}],
  });

  test('cells before prism are painted', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: -2, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: -1, r: 0}))).toBe('red');
  });

  test('prism cell itself is NOT painted', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.has(cellKey({q: 0, r: 0}))).toBe(false);
  });

  test('cells after prism (SE direction) are painted', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: 0, r: 1}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: 0, r: 2}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: 0, r: 3}))).toBe('red');
  });

  test('no cells in original E direction past the prism', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.has(cellKey({q: 1, r: 0}))).toBe(false);
    expect(result.paintedCells.has(cellKey({q: 2, r: 0}))).toBe(false);
  });
});

describe('P-bend prism — beam from all 6 entry directions', () => {
  // One prism at origin with turns:1. Verify exit direction for each entry.
  // Entry E  → exit SE: beam comes from W  side, exits S-E side
  // Entry SE → exit SW: beam comes from NW side, exits S-W side
  // etc.
  const directions: Direction[] = ['E', 'SE', 'SW', 'W', 'NW', 'NE'];

  test.each(directions)('entry direction %s bends to expected exit direction', dir => {
    // Build a source just outside the board so the first board cell is adjacent to origin
    // We'll instead use a target placed one step in the expected exit direction
    const exitDir = rotateCW(dir, 1);
    const {DIRECTIONS} = require('../src/engine/hex');
    const exitDelta = DIRECTIONS[exitDir];
    // Place source one step before origin in the entry direction
    const {DIRECTIONS: D} = require('../src/engine/hex');
    const entryDelta = D[dir];
    // source at -3*entryDelta (start 3 cells back), prism at origin, target at exitDelta*1
    const targetCell = {q: exitDelta.q, r: exitDelta.r};
    const sourceCell = {q: -entryDelta.q * 3, r: -entryDelta.r * 3};

    // Verify sourceCell and targetCell are in radius 3
    const {isInBoard} = require('../src/engine/hex');
    if (!isInBoard(sourceCell, 3) || !isInBoard(targetCell, 3)) return; // skip if geometry doesn't fit R=3

    const puzzle = deserializePuzzle({
      id: 'dir-test',
      boardRadius: 3,
      palette: ['red'],
      sources: [{cell: [sourceCell.q, sourceCell.r], color: 'red', direction: dir}],
      targets: [{cell: [targetCell.q, targetCell.r], requires: 'red'}],
      antiTargets: [],
      prisms: [{type: 'bend', cell: [0, 0], turns: 1}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
      difficulty: {tier: 'easy', score: 1.0},
    });

    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.targetsHit.get(0)).toBe('red');
  });
});

describe('P-bend prism — two prisms in sequence', () => {
  // Source fires E from (-3,0).
  // Prism at (0,0) turns:1 → E bends to SE.
  // Prism at (0,2) turns:1 → SE bends to SW.
  // After second prism: goes SW: (-1,3) — still in R=3? distance=max(1,3,2)=3 yes.
  //   then (-2,3)? distance=max(2,3,1)=3 yes. Then (-3,3)? distance=max(3,3,0)=3 yes. Then (-4,3) out.
  // Wait: SW is (-1,+1). From (0,2): (-1,3),(-2,4) off-board? distance({-2,4})=max(2,4,2)=4>3. off.
  // So painted after 2nd prism: (-1,3) only.
  const puzzle = deserializePuzzle({
    ...base,
    prisms: [
      {type: 'bend', cell: [0, 0], turns: 1},
      {type: 'bend', cell: [0, 2], turns: 1},
    ],
  });

  test('cells before first prism are painted (E path)', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: -2, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: -1, r: 0}))).toBe('red');
  });

  test('neither prism cell is painted', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.has(cellKey({q: 0, r: 0}))).toBe(false);
    expect(result.paintedCells.has(cellKey({q: 0, r: 2}))).toBe(false);
  });

  test('cell between the two prisms is painted (SE path)', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: 0, r: 1}))).toBe('red');
  });

  test('cell after second prism is painted (SW path)', () => {
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: -1, r: 3}))).toBe('red');
  });

  test('atomic: entire chained path commits as one event', () => {
    // Verify that the full path across both prisms appears in one simulate call
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    const painted = [...result.paintedCells.keys()].sort();
    expect(painted).toEqual(
      [
        cellKey({q: -2, r: 0}),
        cellKey({q: -1, r: 0}),
        cellKey({q:  0, r: 1}),
        cellKey({q: -1, r: 3}),
      ].sort(),
    );
  });
});

describe('P-bend prism — beam stops at first obstacle after reflection', () => {
  // Source E from (-3,0), prism at (0,0) turns:1 → SE.
  // Target at (0,1) requires red — beam should hit it and stop.
  test('beam hits target after prism reflection', () => {
    const puzzle = deserializePuzzle({
      ...base,
      targets: [{cell: [0, 1], requires: 'red'}],
      prisms: [{type: 'bend', cell: [0, 0], turns: 1}],
    });
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.targetsHit.get(0)).toBe('red');
    // Cells past the target are not painted
    expect(result.paintedCells.has(cellKey({q: 0, r: 2}))).toBe(false);
  });

  test('beam stops at painted cell after prism reflection', () => {
    // Pre-paint (0,1) by firing a second source into it first
    const puzzle = deserializePuzzle({
      id: 'block-test',
      boardRadius: 3,
      palette: ['red', 'blue'],
      sources: [
        {cell: [-3, 0], color: 'red',  direction: 'E'},   // index 0: fires E, prism bends SE
        {cell: [-3, 1], color: 'blue', direction: 'E'},    // index 1: fires E, paints (0,1) blue
      ],
      targets: [],
      antiTargets: [],
      prisms: [{type: 'bend', cell: [0, 0], turns: 1}],
      canonicalSolution: {firings: [{sourceIndex: 1}, {sourceIndex: 0}], length: 2},
      difficulty: {tier: 'easy', score: 1.0},
    });
    // Fire blue first to paint (0,1) ... wait blue at (-3,1) fires E: (-2,1),(-1,1),(0,1),(1,1),(2,1),(3,1) off
    // Then fire red: hits prism at (0,0), bends SE, next cell (0,1) is painted → stops.
    const result = simulate(puzzle, [{sourceIndex: 1}, {sourceIndex: 0}]);
    expect(result.paintedCells.get(cellKey({q: 0, r: 1}))).toBe('blue'); // not overwritten
    // Red painted pre-prism cells only
    expect(result.paintedCells.get(cellKey({q: -2, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: -1, r: 0}))).toBe('red');
    // Cells past the block are not painted red
    expect(result.paintedCells.has(cellKey({q: 0, r: 2}))).toBe(false);
  });
});

describe('P-bend prism — loop guard', () => {
  // 6 prisms arranged in a ring, each bending 60° CW — beam loops back to start.
  // Ring of radius 1: (1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)
  // Each prism turns:1. Beam enters ring from outside and circulates.
  // The loop guard should stop the beam without infinite loop.
  test('beam terminates when prism loop detected', () => {
    const puzzle = deserializePuzzle({
      id: 'loop-test',
      boardRadius: 3,
      palette: ['red'],
      sources: [{cell: [-3, 0], color: 'red', direction: 'E'}],
      targets: [],
      antiTargets: [],
      prisms: [
        {type: 'bend', cell: [ 1,  0], turns: 1},
        {type: 'bend', cell: [ 0,  1], turns: 1},
        {type: 'bend', cell: [-1,  1], turns: 1},
        {type: 'bend', cell: [-1,  0], turns: 1},
        {type: 'bend', cell: [ 0, -1], turns: 1},
        {type: 'bend', cell: [ 1, -1], turns: 1},
      ],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
      difficulty: {tier: 'easy', score: 1.0},
    });
    // Should not hang; terminates due to loop guard
    expect(() => simulate(puzzle, [{sourceIndex: 0}])).not.toThrow();
  });
});
