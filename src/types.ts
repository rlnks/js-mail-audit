export interface Location {
  line: number;
  column: number;
  offset_start: number;
  offset_end: number;
}

export interface DetectionConfig {
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

export interface AffectedClient {
  supported: boolean;
  versions?: string;
}

export interface Rule {
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

export interface TriggeredRule extends Rule {
  locations: Location[];
}

export interface Insight {
  id: string;
  severity: string;
  weight: number;
  message: string | Record<string, string>;
  fix: string | Record<string, string>;
  affected_clients?: Record<string, AffectedClient>;
  tags?: string[];
  locations: Location[];
}

export interface PassedRule {
  id: string;
  severity: string;
  message: string | Record<string, string>;
  tags?: string[];
}

export interface Summary {
  total_rules_checked: number;
  total_issues: number;
  errors: number;
  warnings: number;
  infos: number;
  passed: number;
}

export interface AnalysisResult {
  score: number;
  insights: Insight[];
  passed: PassedRule[];
  summary: Summary;
}

export interface MailAuditConfig {
  rules?: Rule[];
}
