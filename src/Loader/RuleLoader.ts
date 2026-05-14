import type { Rule } from '../types.js';

export class RuleLoader {
  constructor(private readonly bundledRules?: Rule[]) {}

  load(): Rule[] {
    if (this.bundledRules) return this.bundledRules;

    // Node.js filesystem path — only reached in a server/Node context.
    // Dynamic requires prevent bundlers from including these in browser builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs   = require('fs')   as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const url  = require('url')  as typeof import('url');

    const here     = path.dirname(url.fileURLToPath(import.meta.url));
    const fromDist = path.join(here, '..', 'rules');
    const fromSrc  = path.join(here, '..', '..', 'rules');
    const dir      = fs.existsSync(fromDist) ? fromDist
                   : fs.existsSync(fromSrc)  ? fromSrc
                   : (() => { throw new Error(`Cannot find rules directory (searched: ${fromDist}, ${fromSrc})`); })();

    return fs.readdirSync(dir)
      .filter((f: string) => f.endsWith('.json'))
      .map((f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Rule);
  }
}
