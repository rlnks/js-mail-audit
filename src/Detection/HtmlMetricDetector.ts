import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

export class HtmlMetricDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    if (detection.metric === 'size' && html.length > (detection.threshold ?? 102400)) {
      return [{ line: 1, column: 1, offset_start: 0, offset_end: html.length }];
    }
    return [];
  }
}
