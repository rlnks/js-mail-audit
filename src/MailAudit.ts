import { RuleLoader } from './Loader/RuleLoader.js';
import { RuleEngine } from './Analysis/RuleEngine.js';
import { ScoringEngine } from './Analysis/ScoringEngine.js';
import { FeedbackGenerator } from './Feedback/FeedbackGenerator.js';
import type { AnalysisResult, MailAuditConfig, Rule } from './types.js';

export class MailAudit {
  private readonly locale: string | string[];
  private readonly bundledRules: Rule[] | undefined;

  constructor(config: MailAuditConfig = {}, locale: string | string[] = 'en') {
    this.locale       = locale;
    this.bundledRules = config.rules;
  }

  analyze(html: string): AnalysisResult {
    const rules      = new RuleLoader(this.bundledRules).load();
    const triggered  = new RuleEngine(rules).analyze(html);
    const passed     = rules.filter((r) => !triggered.find((t) => t.id === r.id));
    const score      = new ScoringEngine().calculate(triggered);
    const feedback   = new FeedbackGenerator(this.locale);
    const insights   = feedback.generate(triggered);
    const successes  = feedback.generatePassed(passed);

    return {
      score,
      insights,
      passed: successes,
      summary: {
        total_rules_checked: rules.length,
        total_issues:        triggered.length,
        errors:              triggered.filter((r) => r.severity === 'error').length,
        warnings:            triggered.filter((r) => r.severity === 'warning').length,
        infos:               triggered.filter((r) => r.severity === 'info').length,
        passed:              successes.length,
      },
    };
  }
}
