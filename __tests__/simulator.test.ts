import {deserializePuzzle} from '../src/engine/puzzle';
import {simulate, cellKey} from '../src/engine/simulator';
import theDecoyJson from '../src/engine/fixtures/the-decoy.json';

const decoy = deserializePuzzle(theDecoyJson);

// Decoy sources: [0]=blue SE @(0,-2), [1]=red SE @(1,-2), [2]=red E @(-2,0)
// Decoy targets: [0]=T_R @(1,1) requires red, [1]=T_B @(0,2) requires blue

describe('simulate — The Decoy acceptance tests', () => {
  test('elegant solution [R₂, B] paints both targets correctly, no F1', () => {
    const result = simulate(decoy, [{sourceIndex: 1}, {sourceIndex: 0}]);

    expect(result.targetsHit.get(0)).toBe('red');   // T_R correctly painted
    expect(result.targetsHit.get(1)).toBe('blue');  // T_B correctly painted
    expect(result.antiTargetsPainted.size).toBe(0);
    expect(result.f1).toBe(false);
  });

  test('[R₂, B] leaves R₁ unfired — not all sources fired, so no F1 regardless', () => {
    const result = simulate(decoy, [{sourceIndex: 1}, {sourceIndex: 0}]);
    expect(result.f1).toBe(false);
  });

  test('[R₁] paints (0,0) red and the three other cells along its E path', () => {
    const result = simulate(decoy, [{sourceIndex: 2}]);
    expect(result.paintedCells.get(cellKey({q: -1, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q:  0, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q:  1, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q:  2, r: 0}))).toBe('red');
    expect(result.paintedCells.size).toBe(4);
  });

  test('[R₁, B] — B is blocked by (0,0), T_B not hit', () => {
    const result = simulate(decoy, [{sourceIndex: 2}, {sourceIndex: 0}]);
    expect(result.targetsHit.has(1)).toBe(false); // T_B not reached
    // B's beam stopped at (0,-1) before hitting painted (0,0)
    expect(result.paintedCells.get(cellKey({q: 0, r: -1}))).toBe('blue');
    expect(result.paintedCells.get(cellKey({q: 0, r:  0}))).toBe('red'); // still red, not overwritten
  });

  test('[R₁, B, R₂] — all sources fired, neither target hit → F1', () => {
    // R₁ paints (0,0) and (1,0); B blocked before (0,0); R₂ blocked before (1,0)
    const result = simulate(decoy, [
      {sourceIndex: 2},
      {sourceIndex: 0},
      {sourceIndex: 1},
    ]);
    expect(result.f1).toBe(true);
    expect(result.targetsHit.size).toBe(0);
  });
});

describe('simulate — beam propagation rules', () => {
  const base = {
    id: 'test',
    boardRadius: 3,
    palette: ['red', 'blue'],
    sources: [
      {cell: [-3, 0], color: 'red',  direction: 'E'}, // index 0 fires E from edge
      {cell: [ 3, 0], color: 'blue', direction: 'W'}, // index 1 fires W from edge
    ],
    targets:      [],
    antiTargets:  [],
    prisms:       [],
    canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    difficulty: {tier: 'easy', score: 1.0},
  };

  test('beam exits at board edge with no obstacles', () => {
    const puzzle = deserializePuzzle({...base, targets: [{cell: [0, 0], requires: 'red'}]});
    // Red fires E from (-3,0): (-2,0),(-1,0),(0,0)=target → stops at target
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.targetsHit.get(0)).toBe('red');
    expect(result.paintedCells.size).toBe(3); // (-2,0), (-1,0), (0,0)
  });

  test('beam stops before a painted tile, does not paint it', () => {
    const puzzle = deserializePuzzle({
      ...base,
      targets: [{cell: [2, 0], requires: 'red'}],
    });
    // Fire red first: paints (-2,0),(-1,0),(0,0),(1,0),(2,0)=target
    // Fire blue: starts at (2,0) but (2,0) is painted → beam goes (2,0) is already painted?
    // Actually blue fires W from (3,0), first cell is (2,0) which is painted → stops immediately
    const r1 = simulate(puzzle, [{sourceIndex: 0}]); // red hits target at (2,0)
    const r2 = simulate(puzzle, [{sourceIndex: 0}, {sourceIndex: 1}]); // then blue fires W
    // Blue starts at (2,0) which is painted → immediately blocked, paints nothing new
    expect(r2.paintedCells.get(cellKey({q: 2, r: 0}))).toBe('red'); // target stays red
    expect(r2.paintedCells.get(cellKey({q: 1, r: 0}))).toBe('red'); // not overwritten
    expect(r1.targetsHit.get(0)).toBe('red');
  });

  test('second firing cannot overpaint a cell painted by the first firing', () => {
    const puzzle = deserializePuzzle({
      ...base,
      targets: [],
    });
    // Red paints the row from (-2,0) to (2,0)
    // Blue fires W from (3,0) → first cell is (2,0) which is painted → stops, paints nothing
    const result = simulate(puzzle, [{sourceIndex: 0}, {sourceIndex: 1}]);
    expect(result.paintedCells.get(cellKey({q: 2, r: 0}))).toBe('red');
    expect(result.paintedCells.get(cellKey({q: 0, r: 0}))).toBe('red');
    // Blue paint should not appear anywhere on the red-painted row
    for (let q = -2; q <= 2; q++) {
      expect(result.paintedCells.get(cellKey({q, r: 0}))).toBe('red');
    }
  });

  test('anti-target is painted and recorded; beam stops there', () => {
    const puzzle = deserializePuzzle({
      ...base,
      targets: [],
      antiTargets: [{cell: [0, 0]}],
    });
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.antiTargetsPainted.has(0)).toBe(true);
    expect(result.paintedCells.get(cellKey({q: 0, r: 0}))).toBe('red');
    // Cells past the anti-target should not be painted
    expect(result.paintedCells.has(cellKey({q: 1, r: 0}))).toBe(false);
  });

  test('F1 false when not all sources have fired', () => {
    const puzzle = deserializePuzzle({...base, targets: [{cell: [0, 0], requires: 'blue'}]});
    const result = simulate(puzzle, [{sourceIndex: 0}]); // only red fired
    expect(result.f1).toBe(false);
  });

  test('F1 true when all sources fired and targets unsolved', () => {
    const puzzle = deserializePuzzle({...base, targets: [{cell: [0, 0], requires: 'blue'}]});
    // Red fires E, hits target at (0,0) with red. Target requires blue → wrong colour.
    // Blue fires W, hits (0,0) which is already painted → blocked, never paints.
    const result = simulate(puzzle, [{sourceIndex: 0}, {sourceIndex: 1}]);
    expect(result.f1).toBe(true);
  });

  test('F1 false when all sources fired and targets are solved', () => {
    const puzzle = deserializePuzzle({...base, targets: [{cell: [0, 0], requires: 'red'}]});
    const result = simulate(puzzle, [{sourceIndex: 0}, {sourceIndex: 1}]);
    expect(result.f1).toBe(false);
  });

  test('source cells are not painted even if beam crosses them', () => {
    // Source[1] at (3,0); if red fires E it would pass through or stop at (3,0)
    // Red fires E from (-3,0), the board edge at (3,0) is also source[1]'s cell.
    // The beam hits the board edge at (3,0)... actually (3,0) is in board for R=3?
    // distance({q:3,r:0}) = max(3,0,3) = 3 = radius. Yes, in board.
    // So red fires E: (-2,0),(-1,0),(0,0),(1,0),(2,0),(3,0)=source[1] cell → passes through → (4,0) off board.
    // Source cell (3,0) should NOT be painted.
    const puzzle = deserializePuzzle({...base, targets: []});
    const result = simulate(puzzle, [{sourceIndex: 0}]);
    expect(result.paintedCells.has(cellKey({q: 3, r: 0}))).toBe(false); // source cell not painted
    expect(result.paintedCells.get(cellKey({q: 2, r: 0}))).toBe('red'); // cell before source IS painted
  });
});
