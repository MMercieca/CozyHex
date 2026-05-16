import {generate} from '../src/procgen/generate';
import {findAnySolution, solve} from '../src/engine/solver';
import {simulate, cellKey} from '../src/engine/simulator';

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

describe('generate — anti-targets', () => {
  // 1 canonical source, 1 decoy, 1 anti-target.
  const PARAMS = {boardRadius: 2, sourceCount: 1, targetCount: 1, decoyCount: 1, antiTargetCount: 1};

  test('has the requested number of anti-targets', () => {
    const puzzle = generate(PARAMS, 42);
    expect(puzzle.antiTargets).toHaveLength(1);
  });

  test('canonical solution does not paint any anti-target', () => {
    const puzzle = generate(PARAMS, 42);
    const sim = simulate(puzzle, puzzle.canonicalSolution.firings);
    expect(sim.antiTargetsPainted.size).toBe(0);
  });

  test('anti-target cell is reachable by some source beam (useful, not a dead cell)', () => {
    const puzzle = generate(PARAMS, 42);
    // All-source no-target sim is the full reachable set.
    const naked = {...puzzle, targets: [], antiTargets: []};
    const allFirings = puzzle.sources.map((_, i) => ({sourceIndex: i}));
    const allPainted = simulate(naked, allFirings).paintedCells;
    for (const at of puzzle.antiTargets) {
      expect(allPainted.has(cellKey(at.cell))).toBe(true);
    }
  });

  test('a non-canonical ordering paints the anti-target (anti-target distinguishes Perfect from Solved)', () => {
    // Sweep seeds to find a case where firing the decoy alone in a no-target sim
    // reaches the anti-target cell. Guaranteed by construction: the anti-target is
    // drawn from allPainted − canonicalPainted, so some non-canonical source reaches it.
    let found = false;
    for (let seed = 1; seed <= 100 && !found; seed++) {
      const puzzle = generate(PARAMS, seed);
      if (!puzzle.antiTargets.length) continue;
      const naked = {...puzzle, targets: [], antiTargets: []};
      // Fire only non-canonical sources (decoys are at index >= sourceCount=1).
      for (let i = 1; i < puzzle.sources.length && !found; i++) {
        const sim = simulate(naked, [{sourceIndex: i}]);
        if (sim.paintedCells.has(cellKey(puzzle.antiTargets[0].cell))) found = true;
      }
    }
    expect(found).toBe(true);
  });

  test('deterministic with the same seed', () => {
    const p1 = generate(PARAMS, 55);
    const p2 = generate(PARAMS, 55);
    expect(p1.antiTargets).toEqual(p2.antiTargets);
  });
});

describe('generate — P-bend prisms', () => {
  const PARAMS = {boardRadius: 2, sourceCount: 1, targetCount: 1, pBendCount: 1};

  test('generates a puzzle with exactly 1 P-bend prism', () => {
    const puzzle = generate(PARAMS, 42);
    const bends = puzzle.prisms.filter(p => p.type === 'bend');
    expect(bends).toHaveLength(1);
  });

  test('canonical solution solves the puzzle through the prism', () => {
    const puzzle = generate(PARAMS, 42);
    const sim = simulate(puzzle, puzzle.canonicalSolution.firings);
    expect(puzzle.targets.every((t, i) => sim.targetsHit.get(i) === t.requires)).toBe(true);
  });

  test('removing the prism makes the puzzle unsolvable (prism is load-bearing)', () => {
    const puzzle = generate(PARAMS, 42);
    const withoutPrisms = {...puzzle, prisms: []};
    expect(findAnySolution(withoutPrisms).solvable).toBe(false);
  });

  test('deterministic with the same seed', () => {
    const p1 = generate(PARAMS, 42);
    const p2 = generate(PARAMS, 42);
    expect(p1.prisms).toEqual(p2.prisms);
    expect(p1.targets).toEqual(p2.targets);
  });
});

describe('generate — P-split prisms', () => {
  const PARAMS = {boardRadius: 3, sourceCount: 1, targetCount: 1, pSplitCount: 1};

  test('generates a puzzle with exactly 1 P-split prism and at least 2 targets', () => {
    const puzzle = generate(PARAMS, 42);
    const splits = puzzle.prisms.filter(p => p.type === 'split');
    expect(splits).toHaveLength(1);
    expect(puzzle.targets.length).toBeGreaterThanOrEqual(2);
  });

  test('canonical solution hits all targets through the split', () => {
    const puzzle = generate(PARAMS, 42);
    const sim = simulate(puzzle, puzzle.canonicalSolution.firings);
    expect(puzzle.targets.every((t, i) => sim.targetsHit.get(i) === t.requires)).toBe(true);
  });

  test('removing the split makes the puzzle unsolvable', () => {
    const puzzle = generate(PARAMS, 42);
    const withoutSplits = {...puzzle, prisms: puzzle.prisms.filter(p => p.type !== 'split')};
    expect(findAnySolution(withoutSplits).solvable).toBe(false);
  });

  test('deterministic with the same seed', () => {
    const p1 = generate(PARAMS, 42);
    const p2 = generate(PARAMS, 42);
    expect(p1.prisms).toEqual(p2.prisms);
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
