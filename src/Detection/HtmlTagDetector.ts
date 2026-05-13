import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlTagDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const tags = new Set((detection.patterns ?? []).map((t) => t.toLowerCase().replace(/^<|>$/g, '')));
    const doc = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (!tags.has(el.tagName)) continue;
      const loc = el.sourceCodeLocation;
      if (!loc) continue;
      locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
    }

    return locations;
  }
}
