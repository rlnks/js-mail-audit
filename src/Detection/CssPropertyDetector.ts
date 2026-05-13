import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

const STYLE_ATTR  = /style\s*=\s*(?:"([^"]*?)"|'([^']*?)')/dgi;
const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/dgi;

export class CssPropertyDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const locations: Location[] = [];
    const isRegex = detection.regex === true;

    for (const pattern of detection.patterns ?? []) {
      const regex = this.makeRegex(pattern, isRegex);

      // Search in inline style attributes
      for (const attrMatch of html.matchAll(STYLE_ATTR)) {
        const attrIndices = (attrMatch as RegExpMatchArray & { indices?: [number,number][] }).indices;
        const content     = attrMatch[1] ?? attrMatch[2] ?? '';
        const groupIndex  = attrMatch[1] !== undefined ? 1 : 2;
        const contentOffset = attrIndices ? attrIndices[groupIndex]![0] : attrMatch.index! + attrMatch[0].indexOf(content);

        for (const m of content.matchAll(new RegExp(regex.source, regex.flags))) {
          const mIndices = (m as RegExpMatchArray & { indices?: [number,number][] }).indices;
          const relOffset = mIndices ? mIndices[0]![0] : m.index!;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }

      // Search in <style> blocks
      for (const blockMatch of html.matchAll(STYLE_BLOCK)) {
        const blockIndices  = (blockMatch as RegExpMatchArray & { indices?: [number,number][] }).indices;
        const content       = blockMatch[1] ?? '';
        const contentOffset = blockIndices ? blockIndices[1]![0] : blockMatch.index! + blockMatch[0].indexOf(content);

        for (const m of content.matchAll(new RegExp(regex.source, regex.flags))) {
          const mIndices = (m as RegExpMatchArray & { indices?: [number,number][] }).indices;
          const relOffset = mIndices ? mIndices[0]![0] : m.index!;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }
    }

    return locations;
  }
}
