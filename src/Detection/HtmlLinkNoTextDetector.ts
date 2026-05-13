import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr, getTextContent, type ChildNode } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlLinkNoTextDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    void detection;
    const doc = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== 'a') continue;

      const text = getTextContent(el).trim();
      if (text) continue;

      // Check for <img> child with non-empty alt
      const hasDescriptiveImg = el.childNodes.some((child: ChildNode) => {
        if (!('tagName' in child) || (child as { tagName: string }).tagName !== 'img') return false;
        const alt = getAttr(child as typeof el, 'alt');
        return alt !== undefined && alt.trim() !== '';
      });
      if (hasDescriptiveImg) continue;

      const loc = el.sourceCodeLocation;
      if (loc) {
        locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
      }
    }

    return locations;
  }
}
