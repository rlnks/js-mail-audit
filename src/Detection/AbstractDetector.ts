import type { DetectorInterface } from './DetectorInterface.js';
import type { Location, DetectionConfig } from '../types.js';

export abstract class AbstractDetector implements DetectorInterface {
  abstract findMatches(html: string, detection: DetectionConfig): Location[];

  matches(html: string, detection: DetectionConfig): boolean {
    return this.findMatches(html, detection).length > 0;
  }

  protected buildLocation(html: string, offsetStart: number, length: number): Location {
    const before = html.slice(0, offsetStart);
    const line   = before.split('\n').length;
    const lastNl = before.lastIndexOf('\n');
    const column = lastNl === -1 ? offsetStart + 1 : offsetStart - lastNl;
    return {
      line,
      column,
      offset_start: offsetStart,
      offset_end:   offsetStart + length,
    };
  }

  protected buildLocationsFromRegex(html: string, pattern: RegExp): Location[] {
    const locations: Location[] = [];
    for (const match of html.matchAll(pattern)) {
      const indices = (match as RegExpMatchArray & { indices?: [number, number][] }).indices;
      const offset  = indices ? indices[0]![0] : match.index!;
      locations.push(this.buildLocation(html, offset, match[0].length));
    }
    return locations;
  }

  protected makeRegex(pattern: string, isRegex: boolean, flags = 'dgi'): RegExp {
    const src = isRegex ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(src, flags);
  }
}
