import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Rule } from '../types.js';

function findRulesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const fromDist = join(here, '..', 'rules');
  if (existsSync(fromDist)) return fromDist;
  const fromSrc = join(here, '..', '..', 'rules');
  if (existsSync(fromSrc)) return fromSrc;
  throw new Error(`Cannot find rules directory (searched: ${fromDist}, ${fromSrc})`);
}

export class RuleLoader {
  constructor(private readonly bundledRules?: Rule[]) {}

  load(): Rule[] {
    if (this.bundledRules) return this.bundledRules;
    const dir = findRulesDir();
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Rule);
  }
}
