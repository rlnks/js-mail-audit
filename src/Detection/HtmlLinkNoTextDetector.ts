import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getTextContent, type ChildNode } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlLinkNoTextDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    void detection;
    const doc = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== 'a') continue;

      // Has visible text → not empty
      if (getTextContent(el).trim()) continue;

      // Has any child element (img, span, etc.) → not our concern; empty-alt-img handles that
      const hasElementChild = el.childNodes.some((child: ChildNode) => 'tagName' in child);
      if (hasElementChild) continue;

      const loc = el.sourceCodeLocation;
      if (loc) {
        locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
      }
    }

    return locations;
  }
}
