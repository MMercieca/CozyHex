import {generate} from '../src/procgen/generate';
import {findAnySolution, solve} from '../src/engine/solver';
import {simulate} from '../src/engine/simulator';

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

describe('generate — decoy sources', () => {
  const PARAMS = {boardRadius: 2, sourceCount: 1, targetCount: 1, decoyCount: 2};

  test('decorated puzzle has sourceCount + decoyCount sources total', () => {
    const puzzle = generate(PARAMS, 42);
    expect(puzzle.sources).toHaveLength(PARAMS.sourceCount + PARAMS.decoyCount);
  });

  test('decoy sources are not in the canonical solution', () => {
    const puzzle = generate(PARAMS, 42);
    const canonicalIndices = new Set(puzzle.canonicalSolution.firings.map(f => f.sourceIndex));
    for (let i = PARAMS.sourceCount; i < puzzle.sources.length; i++) {
      expect(canonicalIndices.has(i)).toBe(false);
    }
  });

  test('firing each decoy alone does not solve the puzzle', () => {
    const puzzle = generate(PARAMS, 42);
    for (let i = PARAMS.sourceCount; i < puzzle.sources.length; i++) {
      const simResult = simulate(puzzle, [{sourceIndex: i}]);
      const solved = puzzle.targets.every((t, ti) => simResult.targetsHit.get(ti) === t.requires);
      expect(solved).toBe(false);
    }
  });

  test('alternateCount is preserved — decoys open no new valid solutions', () => {
    const skeleton = generate({boardRadius: 2, sourceCount: 1, targetCount: 1}, 42);
    const decorated = generate(PARAMS, 42);

    const skeletonResult = solve(skeleton);
    const decoratedResult = solve(decorated);

    expect(skeletonResult.solvable).toBe(true);
    expect(decoratedResult.solvable).toBe(true);
    if (!skeletonResult.solvable || !decoratedResult.solvable) return;

    expect(decoratedResult.alternateCount).toBe(skeletonResult.alternateCount);
  });

  test('deterministic with the same seed', () => {
    const p1 = generate(PARAMS, 99);
    const p2 = generate(PARAMS, 99);
    expect(p1.sources).toEqual(p2.sources);
    expect(p1.targets).toEqual(p2.targets);
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
