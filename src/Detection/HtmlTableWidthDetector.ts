import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlTableWidthDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const maxWidth = detection.max_width ?? 600;
    const doc = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== 'table') continue;
      const widthAttr = getAttr(el, 'width');
      if (!widthAttr) continue;
      const px = parseInt(widthAttr, 10);
      if (!isNaN(px) && px > maxWidth) {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }

    return locations;
  }
}
