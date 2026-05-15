import {deserializePuzzle} from '../src/engine/puzzle';
import {solve} from '../src/engine/solver';
import {score} from '../src/engine/scorer';

const BASE = {
  boardRadius: 2,
  palette: ['red'],
  antiTargets: [],
  prisms: [],
  difficulty: {tier: 'easy', score: 0},
};

function makePuzzle(overrides: object) {
  return deserializePuzzle({...BASE, ...overrides});
}

describe('score', () => {
  test('minimal 1-source 1-target puzzle bins as easy', () => {
    const puzzle = makePuzzle({
      id: 'minimal',
      boardRadius: 2,
      sources: [{cell: [-2, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [0, 0], requires: 'red'}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    });
    const solverResult = solve(puzzle);
    expect(solverResult.solvable).toBe(true);
    const result = score(puzzle, solverResult);
    expect(result.tier).toBe('easy');
  });

  test('dense puzzle with many sources, long solution, and prisms bins as hard or expert', () => {
    // N=3 sources, K=3 solution length, 3 prisms (1 split), radius=3 → score well above medium
    // We can't easily create a real N=10 puzzle in a test, so we verify the formula
    // pushes a clearly complex puzzle above the medium threshold.
    const puzzle = makePuzzle({
      id: 'complex',
      boardRadius: 3,
      palette: ['red', 'blue'],
      sources: [
        {cell: [-3, 0], color: 'red', direction: 'E'},
        {cell: [0, -3], color: 'blue', direction: 'SE'},
        {cell: [-3, 1], color: 'red', direction: 'E'},
      ],
      targets: [
        {cell: [0, 0], requires: 'red'},
        {cell: [1, 1], requires: 'blue'},
        {cell: [1, 0], requires: 'red'},
      ],
      antiTargets: [{cell: [2, 0]}],
      prisms: [
        {type: 'bend', cell: [-1, 0], turns: 1},
        {type: 'bend', cell: [0, -1], turns: -1},
        {type: 'split', cell: [-2, 1], orientation: 'E'},
      ],
      canonicalSolution: {firings: [{sourceIndex: 0}, {sourceIndex: 1}, {sourceIndex: 2}], length: 3},
    });
    // Score manually: N=3, K=3, prism=3, split=1, anti=1, solutions≥1, radius=3
    // = 0.5*3 + 1.0*3 + 0.5*3 + 0.5*1 + 1.0*1 - 0.3*log(≥1) + 0.5*3
    // ≥ 1.5 + 3 + 1.5 + 0.5 + 1 - 0 + 1.5 = 9 → hard or expert
    const solverResult = solve(puzzle);
    // The puzzle may or may not be solvable (it's a crafted test fixture).
    // If unsolvable, test the formula directly by calling score with a fake result.
    if (!solverResult.solvable) {
      const fakeResult = {solvable: true as const, canonical: [], length: 3, alternateCount: 1, elegantUnique: true};
      const result = score(puzzle, fakeResult);
      expect(['hard', 'expert']).toContain(result.tier);
    } else {
      const result = score(puzzle, solverResult);
      expect(['hard', 'expert']).toContain(result.tier);
    }
  });

  test('score is pure — same input always returns same output', () => {
    const puzzle = makePuzzle({
      id: 'pure-test',
      sources: [{cell: [-2, 0], color: 'red', direction: 'E'}],
      targets: [{cell: [0, 0], requires: 'red'}],
      canonicalSolution: {firings: [{sourceIndex: 0}], length: 1},
    });
    const solverResult = solve(puzzle);
    expect(solverResult.solvable).toBe(true);
    const r1 = score(puzzle, solverResult);
    const r2 = score(puzzle, solverResult);
    expect(r1).toEqual(r2);
  });

  test('throws on unsolvable puzzle', () => {
    expect(() =>
      score(
        makePuzzle({
          id: 'x',
          sources: [{cell: [-2, 0], color: 'red', direction: 'E'}],
          targets: [{cell: [0, 0], requires: 'red'}],
          canonicalSolution: {firings: [], length: 0},
        }),
        {solvable: false},
      ),
    ).toThrow();
  });
});
