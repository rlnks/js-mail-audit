import type { Location, DetectionConfig } from '../types.js';

export interface DetectorInterface {
  findMatches(html: string, detection: DetectionConfig): Location[];
  matches(html: string, detection: DetectionConfig): boolean;
}
