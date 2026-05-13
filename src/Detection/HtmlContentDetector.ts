import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlContentDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const locations: Location[] = [];
    for (const pattern of detection.patterns ?? []) {
      const regex = this.makeRegex(pattern, detection.regex === true);
      locations.push(...this.buildLocationsFromRegex(html, regex));
    }
    return locations;
  }
}
