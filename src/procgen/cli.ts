#!/usr/bin/env node
/**
 * CozyHex procgen CLI.
 *
 * Commands (coming soon):
 *   generate  Generate a puzzle pack
 *   cull      Cull a pack using playtest feedback
 */

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === '--help' || cmd === '-h' || cmd === undefined) {
  console.log(`
CozyHex procgen

Usage:
  npm run procgen -- <command> [options]

Commands:
  generate    Generate a puzzle pack
                --tier <easy|medium|hard|expert>
                --count <n>
                --seed <number>
                --out <path>
  cull        Cull a draft pack using playtest feedback
                --pack <path>
                --feedback <path>
                --out <path>

Options:
  -h, --help  Show this message
`.trim());
  process.exit(0);
}

console.error(`Unknown command: ${cmd}\nRun with --help for usage.`);
process.exit(1);
