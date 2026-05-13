import type { TriggeredRule } from '../types.js';

const MULTIPLIERS: Record<string, number> = {
  error: 1.0,
  warning: 0.6,
  info: 0.3,
};

export class ScoringEngine {
  calculate(triggered: TriggeredRule[]): number {
    let deduction = 0;
    for (const rule of triggered) {
      const multiplier = MULTIPLIERS[rule.severity] ?? 0.5;
      deduction += rule.weight * multiplier;
    }
    return Math.max(0, Math.round(100 - deduction));
  }
}
