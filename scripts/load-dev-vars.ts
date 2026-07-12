import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Load `.dev.vars` into process.env (Wrangler-style, for local scripts). */
export function loadDevVars(): void {
  const path = resolve(process.cwd(), '.dev.vars');
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
