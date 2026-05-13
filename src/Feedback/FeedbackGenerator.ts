import type { TriggeredRule, Rule, Insight, PassedRule } from '../types.js';

export class FeedbackGenerator {
  constructor(private readonly locale: string | string[] = 'en') {}

  generate(triggered: TriggeredRule[]): Insight[] {
    return triggered.map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      weight: rule.weight,
      message: this.resolve(rule.message),
      fix: this.resolve(rule.fix),
      ...(rule.affected_clients ? { affected_clients: rule.affected_clients } : {}),
      ...(rule.tags ? { tags: rule.tags } : {}),
      locations: rule.locations,
    }));
  }

  generatePassed(rules: Rule[]): PassedRule[] {
    const result: PassedRule[] = [];
    for (const rule of rules) {
      if (!rule.success_message) continue;
      result.push({
        id: rule.id,
        severity: rule.severity,
        message: this.resolve(rule.success_message),
        ...(rule.tags ? { tags: rule.tags } : {}),
      });
    }
    return result;
  }

  private resolve(translations: Record<string, string>): string | Record<string, string> {
    if (typeof this.locale === 'string') {
      return translations[this.locale] ?? translations['en'] ?? '';
    }
    const out: Record<string, string> = {};
    for (const lang of this.locale) {
      out[lang] = translations[lang] ?? translations['en'] ?? '';
    }
    return out;
  }
}
