import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

// Matches font-family declarations containing an unquoted multi-word name
// e.g. font-family: Open Sans, Arial → fires
//      font-family: 'Open Sans', Arial → does not fire
const FONT_FAMILY_DECL = /font-family\s*:\s*([^;}"']+)/dgi;
const UNQUOTED_MULTIWORD = /^[A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*)+/;

export class CssFontFamilyDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    void detection;
    const locations: Location[] = [];

    for (const match of html.matchAll(FONT_FAMILY_DECL)) {
      const indices     = (match as RegExpMatchArray & { indices?: [number,number][] }).indices;
      const declOffset  = indices ? indices[0]![0] : match.index!;
      const value       = match[1] ?? '';

      // Split by comma to check each font name in the stack
      for (const part of value.split(',')) {
        const trimmed = part.trim();
        // Already quoted → fine
        if (/^['"]/.test(trimmed)) continue;
        // Multi-word unquoted → fire
        if (UNQUOTED_MULTIWORD.test(trimmed)) {
          const partOffset = value.indexOf(part);
          locations.push(this.buildLocation(html, declOffset + partOffset, part.length));
          break;
        }
      }
    }

    return locations;
  }
}
