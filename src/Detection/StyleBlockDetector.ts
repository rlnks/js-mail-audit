import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/dgi;

export class StyleBlockDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const locations: Location[] = [];
    const isRegex = detection.regex === true;

    for (const blockMatch of html.matchAll(STYLE_BLOCK)) {
      const blockIndices  = (blockMatch as RegExpMatchArray & { indices?: [number,number][] }).indices;
      const content       = blockMatch[1] ?? '';
      const contentOffset = blockIndices ? blockIndices[1]![0] : blockMatch.index!;

      for (const pattern of detection.patterns ?? []) {
        const regex = this.makeRegex(pattern, isRegex);
        for (const m of content.matchAll(regex)) {
          const mIndices  = (m as RegExpMatchArray & { indices?: [number,number][] }).indices;
          const relOffset = mIndices ? mIndices[0]![0] : m.index!;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }
    }

    return locations;
  }
}
