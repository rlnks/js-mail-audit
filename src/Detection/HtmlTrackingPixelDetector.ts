import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlTrackingPixelDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    void detection;
    const doc = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== 'img') continue;
      const w = getAttr(el, 'width');
      const h = getAttr(el, 'height');
      if (w === '1' && h === '1') {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }

    return locations;
  }
}
