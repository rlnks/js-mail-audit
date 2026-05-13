import { DetectorFactory } from '../Detection/DetectorFactory.js';
import type { Rule, TriggeredRule } from '../types.js';

export class RuleEngine {
  constructor(private readonly rules: Rule[]) {}

  analyze(html: string): TriggeredRule[] {
    const triggered: TriggeredRule[] = [];

    for (const rule of this.rules) {
      const type = rule.detection.type;
      if (!type) continue;

      try {
        const detector  = DetectorFactory.make(type);
        const locations = detector.findMatches(html, rule.detection);
        if (locations.length > 0) {
          triggered.push({ ...rule, locations });
        }
      } catch {
        // Unknown detector type — skip rule silently
      }
    }

    return triggered;
  }
}
