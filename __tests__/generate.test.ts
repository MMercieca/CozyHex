import {generate} from '../src/procgen/generate';
import {findAnySolution} from '../src/engine/solver';

const SMALL: {boardRadius: number; sourceCount: number; targetCount: number} = {
  boardRadius: 2,
  sourceCount: 1,
  targetCount: 1,
};

describe('generate — regression (seed 42)', () => {
  test('produces a valid solvable puzzle with the expected shape', () => {
    const puzzle = generate(SMALL, 42);
    expect(puzzle.boardRadius).toBe(2);
    expect(puzzle.sources).toHaveLength(1);
    expect(puzzle.targets).toHaveLength(1);
    expect(puzzle.antiTargets).toHaveLength(0);
    expect(puzzle.prisms).toHaveLength(0);
    expect(findAnySolution(puzzle).solvable).toBe(true);
  });

  test('same seed produces identical sources and targets (determinism)', () => {
    const p1 = generate(SMALL, 42);
    const p2 = generate(SMALL, 42);
    expect(p1.sources).toEqual(p2.sources);
    expect(p1.targets).toEqual(p2.targets);
  });
});

describe('generate — solvability sweep', () => {
  test('all 50 seeds produce solvable puzzles (1 source, 1 target, radius 2)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const puzzle = generate(SMALL, seed);
      const result = findAnySolution(puzzle);
      expect(result.solvable).toBe(true);
    }
  });

  test('all 50 seeds produce solvable puzzles (2 sources, 2 targets, radius 3)', () => {
    const params = {boardRadius: 3, sourceCount: 2, targetCount: 2};
    for (let seed = 1; seed <= 50; seed++) {
      const puzzle = generate(params, seed);
      const result = findAnySolution(puzzle);
      expect(result.solvable).toBe(true);
    }
  });
});

describe('generate — error handling', () => {
  test('throws when params are impossible to satisfy', () => {
    // radius 1 has 6 border cells; requesting 10 sources is impossible
    expect(() =>
      generate({boardRadius: 1, sourceCount: 10, targetCount: 1, maxAttempts: 10}, 1),
    ).toThrow();
  });
});
