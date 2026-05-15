#!/usr/bin/env node
import {writeFileSync} from 'fs';
import {deserializePuzzle, serializePuzzle} from '../engine/puzzle';
import {generate, type GenerateParams} from './generate';

const VALID_TIERS = ['easy', 'medium', 'hard', 'expert'] as const;
type Tier = (typeof VALID_TIERS)[number];

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      result[args[i].slice(2)] = args[i + 1] ?? 'true';
      i++;
    }
  }
  return result;
}

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

// Default params per tier. Refined during calibration (issue #19).
function tierParams(tier: Tier, radius: number): Omit<GenerateParams, 'boardRadius' | 'maxAttempts'> {
  switch (tier) {
    case 'easy':   return {sourceCount: 1, targetCount: 1, decoyCount: 0};
    case 'medium': return {sourceCount: 2, targetCount: 1, decoyCount: 1};
    case 'hard':   return {sourceCount: 2, targetCount: 2, decoyCount: 2};
    case 'expert': return {sourceCount: 3, targetCount: 2, decoyCount: 3};
  }
}

function defaultRadius(tier: Tier): number {
  return tier === 'hard' || tier === 'expert' ? 3 : 2;
}

function runGenerate(args: string[]): void {
  const opts = parseArgs(args);

  const tier = opts['tier'] as Tier | undefined;
  if (!tier || !VALID_TIERS.includes(tier)) {
    die(`generate: --tier must be ${VALID_TIERS.join('|')}, got "${opts['tier'] ?? '(missing)'}"`);
  }

  const count = parseInt(opts['count'], 10);
  if (!opts['count'] || isNaN(count) || count < 1) die('generate: --count must be a positive integer');

  const out = opts['out'];
  if (!out) die('generate: --out is required');

  const seed = opts['seed'] !== undefined
    ? parseInt(opts['seed'], 10)
    : Math.floor(Math.random() * 2 ** 32);

  const radius = opts['radius'] !== undefined
    ? parseInt(opts['radius'], 10)
    : defaultRadius(tier);

  const maxAttempts = opts['max-attempts'] !== undefined
    ? parseInt(opts['max-attempts'], 10)
    : 1000;

  if (!opts['seed']) {
    console.log(`seed: ${seed}`);
  }

  const params: GenerateParams = {
    boardRadius: radius,
    maxAttempts,
    ...tierParams(tier, radius),
  };

  const puzzles: unknown[] = [];
  for (let i = 0; i < count; i++) {
    let puzzle;
    try {
      puzzle = generate(params, seed + i);
    } catch (e) {
      console.error(`generate: failed on puzzle ${i + 1}/${count}: ${(e as Error).message}`);
      process.exit(1);
    }
    const serialized = serializePuzzle(puzzle);
    // Round-trip validate against schema before writing.
    deserializePuzzle(serialized);
    puzzles.push(serialized);
  }

  const pack = {
    manifest: {
      tier,
      count: puzzles.length,
      seed,
      radius,
      generatedAt: new Date().toISOString(),
      engineVersion: '0.0.1',
    },
    puzzles,
  };

  writeFileSync(out, JSON.stringify(pack, null, 2));
  console.log(`wrote ${puzzles.length} puzzle(s) to ${out}`);
}

// --- Dispatch ---

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === '--help' || cmd === '-h' || !cmd) {
  console.log(`
CozyHex procgen

Usage:
  npm run procgen -- <command> [options]

Commands:
  generate    Generate a puzzle pack
                --tier <easy|medium|hard|expert>  (required)
                --count <n>                        (required)
                --out <path>                       (required)
                --seed <number>                    (optional, random if omitted)
                --radius <2|3|4>                   (optional)
                --max-attempts <n>                 (optional, default 1000)
  cull        Cull a draft pack using playtest feedback
                --pack <path>
                --feedback <path>
                --out <path>

Options:
  -h, --help  Show this message
`.trim());
  process.exit(0);
}

if (cmd === 'generate') {
  runGenerate(args.slice(1));
  process.exit(0);
}

console.error(`Unknown command: ${cmd}\nRun with --help for usage.`);
process.exit(1);
