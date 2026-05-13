import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlTagWithStyleDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const tag        = (detection.tag ?? '').toLowerCase();
    const patterns   = detection.css_patterns ?? [];
    const isRegex    = detection.regex === true;
    const doc        = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== tag) continue;
      const style = getAttr(el, 'style') ?? '';
      if (!style) continue;

      const matched = patterns.some((p) => {
        const regex = this.makeRegex(p, isRegex, 'i');
        return regex.test(style);
      });

      if (matched) {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }

    return locations;
  }
}
