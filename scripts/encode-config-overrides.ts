/**
 * Encode a config.overrides.json file into a single-line string for BOT_CONFIG_OVERRIDES.
 *
 * Usage:
 *   npm run encode-config -- config.overrides.json
 *
 * Copy the output into Cloudflare Dashboard → Worker → Secrets → BOT_CONFIG_OVERRIDES
 * or into .dev.vars for local development.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = process.argv[2] ?? 'config.overrides.json';
const absolutePath = resolve(process.cwd(), inputPath);

let raw: string;
try {
  raw = readFileSync(absolutePath, 'utf-8');
} catch {
  console.error(`Could not read file: ${absolutePath}`);
  console.error('Create config.overrides.json from config.overrides.example.json');
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  console.error('Invalid JSON:', error);
  process.exit(1);
}

const encoded = JSON.stringify(parsed);

console.log('\n--- Paste this as BOT_CONFIG_OVERRIDES in Cloudflare (Secret) ---\n');
console.log(encoded);
console.log('\n--- For .dev.vars, use this line ---\n');
console.log(`BOT_CONFIG_OVERRIDES=${encoded}`);
console.log('');
