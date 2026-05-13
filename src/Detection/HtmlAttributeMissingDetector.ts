import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlAttributeMissingDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const tag        = (detection.tag ?? '').toLowerCase();
    const attributes = detection.attributes ?? [];
    const attrValue  = detection.attribute_value;
    const onlyEmpty  = detection.only_empty === true;
    const doc        = parseHtml(html);
    const locations: Location[] = [];

    for (const el of walkElements(doc)) {
      if (el.tagName !== tag) continue;

      for (const attr of attributes) {
        const value = getAttr(el, attr);

        let fires = false;
        if (onlyEmpty) {
          fires = value === '';
        } else if (attrValue !== undefined) {
          fires = value !== attrValue;
        } else {
          fires = value === undefined;
        }

        if (fires) {
          const loc = el.sourceCodeLocation;
          if (loc) {
            locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
          }
          break;
        }
      }
    }

    return locations;
  }
}
