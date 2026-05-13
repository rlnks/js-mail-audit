import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Rule } from '../types.js';

const RULES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'rules');

export class RuleLoader {
  constructor(private readonly bundledRules?: Rule[]) {}

  load(): Rule[] {
    if (this.bundledRules) return this.bundledRules;
    return readdirSync(RULES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(RULES_DIR, f), 'utf-8')) as Rule);
  }
}
