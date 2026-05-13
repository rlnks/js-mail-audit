import { AbstractDetector } from './AbstractDetector.js';
import { parseHtml, walkElements, getAttr, getTextContent } from './parse5Utils.js';
import type { Location, DetectionConfig } from '../types.js';

const FILLER_PATTERN = /(&nbsp;|&zwnj;| |‌)+/gi;

export class PreheaderDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const mode = detection.mode ?? 'missing';

    if (mode === 'missing') {
      // Only fire on complete documents (has <body>)
      if (!/<body[\s>]/i.test(html)) return [];
      const doc = parseHtml(html);
      for (const el of walkElements(doc)) {
        if (el.tagName !== 'div') continue;
        const style = getAttr(el, 'style') ?? '';
        if (/display\s*:\s*none/i.test(style) && /overflow\s*:\s*hidden/i.test(style)) {
          return [];
        }
      }
      return [{ line: 1, column: 1, offset_start: 0, offset_end: html.length }];
    }

    if (mode === 'too_long') {
      const maxLength = detection.max_length ?? 150;
      const doc = parseHtml(html);
      for (const el of walkElements(doc)) {
        if (el.tagName !== 'div') continue;
        const style = getAttr(el, 'style') ?? '';
        if (/display\s*:\s*none/i.test(style) && /overflow\s*:\s*hidden/i.test(style)) {
          const raw  = getTextContent(el);
          const text = raw.replace(FILLER_PATTERN, '').trim();
          if (text.length > maxLength) {
            const loc = el.sourceCodeLocation;
            if (loc) {
              return [this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset)];
            }
          }
        }
      }
    }

    return [];
  }
}
