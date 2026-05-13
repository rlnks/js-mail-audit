import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Rule } from '../types.js';

function findRulesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // Compiled (dist/index.js): one level up
  const fromDist = join(here, '..', 'rules');
  if (existsSync(fromDist)) return fromDist;
  // Source (src/Loader/RuleLoader.ts, e.g. vitest): two levels up
  const fromSrc = join(here, '..', '..', 'rules');
  if (existsSync(fromSrc)) return fromSrc;
  throw new Error(`Cannot find rules directory (searched: ${fromDist}, ${fromSrc})`);
}

const RULES_DIR = findRulesDir();

export class RuleLoader {
  constructor(private readonly bundledRules?: Rule[]) {}

  load(): Rule[] {
    if (this.bundledRules) return this.bundledRules;
    return readdirSync(RULES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(RULES_DIR, f), 'utf-8')) as Rule);
  }
}
