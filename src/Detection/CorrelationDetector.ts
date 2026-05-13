import { AbstractDetector } from './AbstractDetector.js';
import type { Location, DetectionConfig } from '../types.js';

// DetectorFactory is accessed only inside findMatches(), never at module init,
// so the ESM circular reference (Factory → Correlation → Factory) resolves safely.
import { DetectorFactory } from './DetectorFactory.js';

export class CorrelationDetector extends AbstractDetector {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const triggerConfig = detection.trigger;
    if (!triggerConfig) return [];

    const triggerLocations = DetectorFactory.make(triggerConfig.type).findMatches(html, triggerConfig);
    if (triggerLocations.length === 0) return [];

    const fallbackConfig = detection.fallback;
    if (fallbackConfig) {
      const fallbackLocations = DetectorFactory.make(fallbackConfig.type).findMatches(html, fallbackConfig);
      if (fallbackLocations.length > 0) return [];
    }

    return triggerLocations;
  }
}
