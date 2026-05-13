interface Location {
    line: number;
    column: number;
    offset_start: number;
    offset_end: number;
}
interface DetectionConfig {
    type: string;
    patterns?: string[];
    regex?: boolean;
    tag?: string;
    tags?: string[];
    attributes?: string[];
    attribute_value?: string;
    only_empty?: boolean;
    css_patterns?: string[];
    metric?: string;
    threshold?: number;
    max_width?: number;
    max_length?: number;
    mode?: string;
    trigger?: DetectionConfig;
    fallback?: DetectionConfig;
}
interface AffectedClient {
    supported: boolean;
    versions?: string;
}
interface Rule {
    id: string;
    version: string;
    updated_at: string;
    tier: string;
    severity: 'error' | 'warning' | 'info';
    weight: number;
    tags?: string[];
    detection: DetectionConfig;
    affected_clients?: Record<string, AffectedClient>;
    message: Record<string, string>;
    fix: Record<string, string>;
    success_message?: Record<string, string>;
}
interface TriggeredRule extends Rule {
    locations: Location[];
}
interface Insight {
    id: string;
    severity: string;
    weight: number;
    message: string | Record<string, string>;
    fix: string | Record<string, string>;
    affected_clients?: Record<string, AffectedClient>;
    tags?: string[];
    locations: Location[];
}
interface PassedRule {
    id: string;
    severity: string;
    message: string | Record<string, string>;
    tags?: string[];
}
interface Summary {
    total_rules_checked: number;
    total_issues: number;
    errors: number;
    warnings: number;
    infos: number;
    passed: number;
}
interface AnalysisResult {
    score: number;
    insights: Insight[];
    passed: PassedRule[];
    summary: Summary;
}
interface MailAuditConfig {
    rules?: Rule[];
}

declare class MailAudit {
    private readonly locale;
    private readonly bundledRules;
    constructor(config?: MailAuditConfig, locale?: string | string[]);
    analyze(html: string): AnalysisResult;
}

interface DetectorInterface {
    findMatches(html: string, detection: DetectionConfig): Location[];
    matches(html: string, detection: DetectionConfig): boolean;
}

type DetectorCtor = new () => DetectorInterface;
declare class DetectorFactory {
    static make(type: string): DetectorInterface;
    static register(type: string, ctor: DetectorCtor): void;
}

export { type AnalysisResult, DetectorFactory, type Insight, type Location, MailAudit, type MailAuditConfig, type PassedRule, type Rule, type Summary, type TriggeredRule };
