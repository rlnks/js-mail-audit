import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

export class HeadingOrderDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    void detection;
    const doc = parseHtml(html);
    const headings: Array<{ level: number; loc: { startOffset: number; endOffset: number } }> = [];

    for (const el of walkElements(doc)) {
      if (!HEADING_TAGS.has(el.tagName)) continue;
      const loc = el.sourceCodeLocation;
      if (!loc) continue;
      headings.push({ level: parseInt(el.tagName[1]!, 10), loc });
    }

    const locations: Location[] = [];
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1]!;
      const curr = headings[i]!;
      if (curr.level > prev.level + 1) {
        locations.push(this.buildLocation(html, curr.loc.startOffset, curr.loc.endOffset - curr.loc.startOffset));
      }
    }

    return locations;
  }
}
