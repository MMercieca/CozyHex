import {execSync} from 'child_process';
import {readFileSync, unlinkSync, existsSync} from 'fs';
import {deserializePuzzle} from '../src/engine/puzzle';

const PROJECT_ROOT = '/Users/mercieca/projects/alien-tech/CozyHex';
const OUT = '/tmp/cozyhex-test-pack.json';

afterEach(() => {
  if (existsSync(OUT)) unlinkSync(OUT);
});

describe('procgen generate CLI', () => {
  test('smoke: --tier easy --count 5 --seed 42 produces a parseable pack with 5 puzzles', () => {
    execSync(
      `npx tsx src/procgen/cli.ts generate --tier easy --count 5 --seed 42 --out ${OUT}`,
      {cwd: PROJECT_ROOT, stdio: 'pipe'},
    );

    const raw = JSON.parse(readFileSync(OUT, 'utf8'));

    expect(raw.manifest).toMatchObject({tier: 'easy', count: 5, seed: 42});
    expect(raw.manifest.generatedAt).toBeDefined();
    expect(raw.puzzles).toHaveLength(5);

    for (const puzzleJson of raw.puzzles) {
      expect(() => deserializePuzzle(puzzleJson)).not.toThrow();
    }
  });

  test('missing required args exits non-zero', () => {
    expect(() =>
      execSync(`npx tsx src/procgen/cli.ts generate --tier easy --count 5`, {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
      }),
    ).toThrow();
  });
});
