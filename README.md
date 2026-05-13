# @rlnks/mail-audit

**Email HTML quality analysis engine for JavaScript and TypeScript.**

Analyze email templates before sending — detect compatibility issues, score your HTML against major email clients, and get actionable insights to fix problems before they reach your users' inboxes.

> "Grammarly for HTML emails"

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@rlnks/mail-audit.svg)](https://www.npmjs.com/package/@rlnks/mail-audit)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

Port of [`rlnks/php-mail-audit`](https://github.com/rlnks/php-mail-audit) — identical rule set, identical result format, TypeScript-native.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Result Format](#result-format)
- [Bundled Rules](#bundled-rules)
- [Detection Types](#detection-types)
- [Localization](#localization)
- [Custom Rules](#custom-rules)
- [Custom Detectors](#custom-detectors)
- [Browser Usage](#browser-usage)
- [Score Calculation](#score-calculation)
- [Integration Examples](#integration-examples)
- [Development](#development)
- [License](#license)

---

## Requirements

- Node.js 18 or higher
- One runtime dependency: [`parse5`](https://github.com/inikulin/parse5) for DOM parsing

---

## Installation

```bash
npm install @rlnks/mail-audit
```

---

## Quick Start

```ts
import { MailAudit } from '@rlnks/mail-audit';

const html   = fs.readFileSync('path/to/template.html', 'utf-8');
const result = new MailAudit().analyze(html);

console.log(`Score: ${result.score}/100`);
console.log(`Issues: ${result.summary.total_issues} | Passed: ${result.summary.passed}`);

for (const insight of result.insights) {
  console.log(`[${insight.severity}] ${insight.message}`);
  console.log(`  Fix: ${insight.fix}`);
}

for (const check of result.passed) {
  console.log(`[pass] ${check.message}`);
}
```

**Example output:**

```
Score: 72/100
Issues: 5 | Passed: 14

[error] Flexbox is not supported in Outlook desktop and Outlook on Windows.
  Fix: Replace flexbox with HTML table-based layouts.

[warning] Table with fixed width exceeding 600px detected — emails wider than 600px
cause horizontal scrolling on most desktop clients.
  Fix: Set your content table to a maximum of 600px wide.

[info] No preheader text detected — the inbox preview will show unrelated body text.
  Fix: Add a hidden preheader div immediately after <body>.

[pass] No flexbox layout detected — good compatibility with Outlook desktop.
[pass] All links have accessible text — screen readers can describe every link destination.
```

---

## Configuration

```ts
const audit = new MailAudit(
  config,   // optional: { rules?: Rule[] }
  locale,   // optional: 'en' | 'fr' | 'es' | 'de' | 'pt' | string[] — default 'en'
);
```

All parameters are optional. The package works out of the box with the 56 bundled rules in English.

---

## Result Format

`analyze(html)` returns a plain object:

```ts
{
  score:    81,          // number, 0–100
  insights: [ ... ],    // triggered rules (issues)
  passed:   [ ... ],    // rules that passed with a positive check message
  summary:  { ... },    // aggregate counts
}
```

### `score`

An integer between `0` and `100`. Higher is better. See [Score Calculation](#score-calculation).

### `insights`

Each triggered rule produces one insight:

```ts
{
  id:               'no-flexbox',
  severity:         'error',          // 'error' | 'warning' | 'info'
  weight:           15,
  message:          'Flexbox is not supported in Outlook desktop...',
  fix:              'Replace flexbox with HTML table-based layout...',
  affected_clients: {
    outlook_desktop: { supported: false, versions: 'all' },
    gmail_web:       { supported: false, versions: '< 2022' },
    apple_mail:      { supported: true },
  },
  tags:      ['css', 'layout'],
  locations: [
    { line: 12, column: 5, offset_start: 450, offset_end: 471 },
  ],
}
```

Every `location` entry points to one occurrence of the issue in the source HTML. Use `offset_start`/`offset_end` with editor APIs (CodeMirror, Monaco) to highlight the exact position, and `line`/`column` for cursor placement.

When multiple locales are requested, `message` and `fix` become objects keyed by locale:

```ts
// new MailAudit({}, ['en', 'fr'])
insight.message // { en: '...', fr: '...' }
```

### `passed`

Rules that did **not** trigger and carry a `success_message` appear here — useful for showing positive feedback alongside issues:

```ts
{
  id:       'no-flexbox',
  severity: 'error',
  message:  'No flexbox detected — good compatibility with Outlook.',
  tags:     ['css', 'layout'],
}
```

### `summary`

```ts
{
  total_rules_checked: 56,
  total_issues:        3,
  errors:              1,
  warnings:            1,
  infos:               1,
  passed:              9,
}
```

---

## Bundled Rules

56 rules ship with the package. The philosophy: **flag bad usage, not feature presence**. Media queries, hover states, and class selectors used correctly (with inline fallbacks) score well. The engine penalizes the *absence* of fallbacks, not the features themselves.

### Errors — break rendering in major clients

| Rule ID | Description | Weight |
|---|---|---|
| `no-flexbox` | CSS `display: flex` not supported in Outlook | 15 |
| `no-grid` | CSS `display: grid` not supported anywhere | 15 |
| `no-form-elements` | `<form>`, `<input>`, `<button>` stripped by all clients | 15 |
| `no-script` | `<script>` stripped by all clients for security reasons | 15 |
| `no-iframe` | `<iframe>` blocked by all clients | 15 |
| `no-svg` | SVG not rendered in Outlook or Gmail | 12 |
| `no-video` | `<video>` not supported in Outlook or Gmail | 12 |
| `no-audio` | `<audio>` not supported in any major client | 10 |
| `no-css-gap` | CSS `gap` / `row-gap` / `column-gap` not supported anywhere | 9 |
| `no-object-fit` | `object-fit` not supported in any major client | 8 |
| `no-css-filter` | CSS `filter` not supported in Outlook or Gmail | 8 |
| `no-clip-path` | `clip-path` not supported in any major client | 8 |
| `no-css-variables` | CSS `var()` without a fallback value — silently ignored by Outlook and Gmail | 7 |

### Warnings — real problems when fallbacks are missing

| Rule ID | Description | Weight |
|---|---|---|
| `style-no-inline-fallback` | `<style>` block present but zero inline styles — layout breaks when Gmail/Outlook strip the style block | 12 |
| `html-too-large` | HTML exceeds 102 KB — Gmail clips the message | 10 |
| `media-no-inline-base` | `@media` queries present but no inline style baseline | 10 |
| `img-dimensions` | `<img>` without `width`/`height` — layout breaks when images are blocked | 8 |
| `no-float` | `float` breaks column layouts in Outlook 2007–2019 | 8 |
| `font-no-fallback` | External font loaded but no inline `font-family` fallback stack | 8 |
| `no-picture` | `<picture>` / `srcset` not supported in Outlook or Gmail | 8 |
| `missing-alt-img` | `<img>` without `alt` shows broken icons when images are blocked | 7 |
| `no-css-calc` | `calc()` not supported in Outlook 2007–2019 or Gmail | 7 |
| `missing-https` | HTTP links detected — email clients block mixed content | 6 |
| `text-image-ratio` | Email is too image-heavy — high spam filter risk | 6 |
| `no-div-layout` | `<div>` with layout CSS — box model ignored by Outlook | 6 |
| `no-animation` | CSS `animation` / `@keyframes` ignored by Outlook and Gmail | 6 |
| `url-unencoded` | Unencoded space in a URL — breaks the link in all clients | 5 |
| `css-at-import` | `@import` in `<style>` silently ignored by Gmail/Outlook | 5 |
| `css-at-import-no-link` | `@import` with no `<link>` fallback — font won't load when `<style>` is stripped | 5 |
| `link-no-text` | `<a>` with no accessible text — announced as unlabeled by screen readers | 5 |
| `email-max-width` | Fixed-width `<table>` over 600 px — overflows Outlook and narrow viewports | 5 |
| `no-transform` | CSS `transform` not supported in Outlook or Gmail | 5 |

### Info — usage noted, minimal score impact

| Rule ID | Description | Weight |
|---|---|---|
| `no-position-absolute` | `position: absolute/fixed` ignored in most clients | 5 |
| `no-border-radius` | `border-radius` ignored by Outlook desktop | 4 |
| `no-box-shadow` | `box-shadow` not supported in Outlook | 3 |
| `no-transition` | CSS `transition` not supported in Outlook or Gmail | 3 |
| `table-role-presentation` | Layout tables without `role="presentation"` confuse screen readers | 3 |
| `preheader-missing` | No preheader div found — inbox preview shows unrelated body text | 3 |
| `inline-css` | `<style>` block present — acceptable when paired with inline fallbacks | 2 |
| `css-class-selectors` | Class-based CSS in `<style>` — Gmail strips `class` attributes | 2 |
| `css-media-queries` | `@media` queries detected — great when paired with inline styles | 2 |
| `no-external-fonts` | External font loaded — supported in Apple Mail, not Gmail/Outlook | 2 |
| `missing-lang` | `<html>` without `lang` attribute | 2 |
| `missing-viewport` | No `<meta name="viewport">` — mobile clients may render at desktop width | 2 |
| `preheader-too-long` | Preheader text exceeds 150 characters — most clients truncate at 85–150 chars | 2 |
| `heading-order` | Heading levels skipped (e.g. `<h1>` directly followed by `<h3>`) | 2 |
| `font-family-unquoted` | Multi-word font name used without quotes in `font-family` | 2 |
| `missing-charset` | No character encoding declaration in `<head>` | 2 |
| `missing-doctype` | No `<!DOCTYPE html>` declaration | 2 |
| `table-cellspacing` | `<table>` without `cellpadding="0" cellspacing="0"` | 2 |
| `css-pseudo-selectors` | `:hover`, `:focus` etc. — ignored in Outlook/Gmail | 1 |
| `div-content` | `<div>` used as content wrapper — `<td>` preferred | 1 |
| `empty-alt-img` | `<img alt="">` — verify image is truly decorative | 1 |
| `nbsp-missing` | Regular space between a number and a currency/unit symbol | 1 |
| `missing-body-bgcolor` | No background color on `<body>` | 1 |
| `tracking-pixel` | 1×1 tracking pixel detected — Apple Mail MPP may cause false open events | 0 |

---

## Detection Types

Every rule declares a `detection` object specifying how the engine finds the issue. All detectors return exact character positions (`line`, `column`, `offset_start`, `offset_end`) for every match.

### `css_property`

Matches CSS patterns in inline `style=""` attributes and `<style>` blocks.

```json
{ "type": "css_property", "patterns": ["display: flex", "display:flex"] }
```

Supports `"regex": true` for precision matching:

```json
{ "type": "css_property", "regex": true, "patterns": ["(?<![a-z-])transform\\s*:"] }
```

### `html_content`

Matches arbitrary patterns anywhere in the raw HTML string.

```json
{ "type": "html_content", "patterns": ["fonts.googleapis.com"] }
```

Supports `"regex": true`. The `~` character is used as delimiter internally — escape it as `\\~` if needed.

### `html_tag`

Fires when the specified HTML tag is present. Tag names without angle brackets.

```json
{ "type": "html_tag", "patterns": ["div", "svg", "form"] }
```

### `html_attribute_missing`

Fires when a tag is missing a required attribute, has the wrong value, or (with `only_empty`) has an empty value.

```json
{ "type": "html_attribute_missing", "tag": "img", "attributes": ["width", "height"] }
```

```json
{ "type": "html_attribute_missing", "tag": "table", "attributes": ["role"], "attribute_value": "presentation" }
```

```json
{ "type": "html_attribute_missing", "tag": "img", "attributes": ["alt"], "only_empty": true }
```

### `html_tag_with_style`

Fires when a tag is present **and** its inline `style` contains one of the CSS patterns.

```json
{ "type": "html_tag_with_style", "tag": "div", "css_patterns": ["width:", "float:"] }
```

Supports `"regex": true`.

### `style_block`

Searches exclusively inside `<style>` block content.

```json
{ "type": "style_block", "patterns": ["@media", "@import"] }
```

### `correlation`

Fires when a **trigger** pattern is present but an expected **fallback** pattern is absent.

```json
{
  "type": "correlation",
  "trigger":  { "type": "html_content", "patterns": ["fonts.googleapis.com"] },
  "fallback": { "type": "css_property", "regex": true, "patterns": ["font-family\\s*:[^;]*,"] }
}
```

### `preheader`

Detects the standard email preheader pattern — a `<div>` with `display:none` and `overflow:hidden`.

```json
{ "type": "preheader", "mode": "missing" }
```

```json
{ "type": "preheader", "mode": "too_long", "max_length": 150 }
```

`mode: missing` only fires on complete documents (those containing a `<body>` tag). Fragments are skipped.

### `html_metric`

Fires when a numeric property exceeds a threshold. Currently supported metric: `size` (byte length).

```json
{ "type": "html_metric", "metric": "size", "threshold": 102400 }
```

### `heading_order`

Fires when heading levels are skipped in document order (e.g. `<h1>` directly followed by `<h3>`). No configuration options.

```json
{ "type": "heading_order" }
```

### `link_no_text`

Fires when an `<a>` has no text content and no child `<img>` with a non-empty `alt`. No configuration options.

```json
{ "type": "link_no_text" }
```

### `tracking_pixel`

Fires when an `<img>` has `width="1"` and `height="1"`. No configuration options.

```json
{ "type": "tracking_pixel" }
```

### `css_font_family`

Fires when a multi-word font name is used unquoted in a `font-family` declaration. No configuration options.

```json
{ "type": "css_font_family" }
```

### `table_max_width`

Fires when a `<table>` has a fixed pixel `width` exceeding `max_width` (default: 600).

```json
{ "type": "table_max_width", "max_width": 600 }
```

---

## Localization

Five locales ship out of the box: `en`, `fr`, `es`, `de`, `pt`.

### Single locale

```ts
const audit  = new MailAudit({}, 'fr');
const result = audit.analyze(html);
// result.insights[0].message → string in French
```

Falls back to `en` for any rule missing the requested locale.

### Multiple locales

```ts
const audit  = new MailAudit({}, ['en', 'fr']);
const result = audit.analyze(html);
// result.insights[0].message → { en: '...', fr: '...' }
// result.insights[0].fix     → { en: '...', fr: '...' }
```

Useful for building multi-language UIs without running `analyze()` twice.

---

## Custom Rules

### 1. Write a rule JSON file

```json
{
  "id": "no-marquee",
  "version": "1.0",
  "updated_at": "2026-05-13",
  "tier": "free",
  "severity": "error",
  "weight": 10,
  "tags": ["html"],
  "detection": {
    "type": "html_tag",
    "patterns": ["marquee"]
  },
  "message": {
    "en": "<marquee> is not supported in any modern email client.",
    "fr": "<marquee> n'est pas supporté par les clients email modernes."
  },
  "fix": {
    "en": "Replace with a static text element.",
    "fr": "Remplacez par un élément texte statique."
  }
}
```

### 2. Pass it to MailAudit

```ts
import { MailAudit } from '@rlnks/mail-audit';
import type { Rule } from '@rlnks/mail-audit';
import noMarquee from './rules/no-marquee.json' assert { type: 'json' };

const result = new MailAudit({ rules: [...defaultRules, noMarquee as Rule] }).analyze(html);
```

To get the bundled rules array:

```ts
import { RuleLoader } from '@rlnks/mail-audit'; // not exported by default — see note below
```

Or load them yourself:

```ts
import { MailAudit } from '@rlnks/mail-audit';

// The simplest approach: pass your extra rule alongside the bundled ones
// by subclassing (or just use the rules config option with a merged array).
```

---

## Custom Detectors

### 1. Implement `DetectorInterface`

```ts
import type { DetectorInterface } from '@rlnks/mail-audit';
import type { Location, DetectionConfig } from '@rlnks/mail-audit';

class MjmlTagDetector implements DetectorInterface {
  findMatches(html: string, detection: DetectionConfig): Location[] {
    const locations: Location[] = [];
    for (const tag of detection.tags ?? []) {
      let idx = html.indexOf(`<mj-${tag}`);
      while (idx !== -1) {
        const end = html.indexOf('>', idx) + 1;
        locations.push({ line: 1, column: 1, offset_start: idx, offset_end: end });
        idx = html.indexOf(`<mj-${tag}`, idx + 1);
      }
    }
    return locations;
  }

  matches(html: string, detection: DetectionConfig): boolean {
    return this.findMatches(html, detection).length > 0;
  }
}
```

### 2. Register it

```ts
import { DetectorFactory } from '@rlnks/mail-audit';

DetectorFactory.register('mjml_tag', MjmlTagDetector);
```

### 3. Use it in a rule JSON

```json
{ "detection": { "type": "mjml_tag", "tags": ["section", "column"] } }
```

Registration is global — register once at application bootstrap before calling `analyze()`.

---

## Browser Usage

The package is Node-first (rules are loaded from disk at runtime). For browser usage, pass the rules explicitly:

```ts
// In your bundler entry point, import the rules statically
import noFlexbox from '@rlnks/mail-audit/rules/no-flexbox.json' assert { type: 'json' };
// ... import all rules you need

import { MailAudit } from '@rlnks/mail-audit';

const rules  = [noFlexbox, /* ... */];
const result = new MailAudit({ rules }).analyze(html);
```

parse5 (the DOM parser) works in browsers via any bundler — no Node-specific APIs used.

---

## Score Calculation

The score starts at **100**. Each triggered rule deducts a weighted amount:

```
deduction = weight × severity_multiplier

severity multipliers:
  error   → 1.0
  warning → 0.6
  info    → 0.3

score = max(0, round(100 − Σ deductions))
```

**Example:**

| Rule | Severity | Weight | Multiplier | Deduction |
|---|---|---|---|---|
| `no-svg` | error | 12 | × 1.0 | 12.0 |
| `style-no-inline-fallback` | warning | 12 | × 0.6 | 7.2 |
| `no-css-calc` | warning | 7 | × 0.6 | 4.2 |
| `css-media-queries` | info | 2 | × 0.3 | 0.6 |
| **Total** | | | | **24.0** |
| **Score** | | | | **76 / 100** |

---

## Integration Examples

### Node.js / CI pipeline

```ts
import { MailAudit } from '@rlnks/mail-audit';
import { readFileSync } from 'node:fs';

const html   = readFileSync('templates/welcome.html', 'utf-8');
const result = new MailAudit().analyze(html);

if (result.score < 70) {
  console.error(`Email quality score too low: ${result.score}/100`);
  process.exit(1);
}
console.log(`Score: ${result.score}/100 — OK`);
```

### GitHub Actions

```yaml
- name: Audit email templates
  run: |
    node --input-type=module << 'EOF'
    import { MailAudit } from '@rlnks/mail-audit';
    import { readFileSync } from 'node:fs';
    const result = new MailAudit().analyze(readFileSync('templates/welcome.html', 'utf-8'));
    if (result.score < 70) { console.error('Score too low: ' + result.score); process.exit(1); }
    console.log('Score: ' + result.score + '/100 — OK');
    EOF
```

### Express API endpoint

```ts
import express from 'express';
import { MailAudit } from '@rlnks/mail-audit';

const app   = express();
const audit = new MailAudit({}, 'en');

app.post('/audit', express.text({ type: 'text/html', limit: '1mb' }), (req, res) => {
  res.json(audit.analyze(req.body));
});
```

### React / Next.js (browser bundle)

```tsx
import { MailAudit } from '@rlnks/mail-audit';
// Rules must be passed explicitly in browser contexts
import rules from './email-rules.json'; // pre-assembled array of rule objects

export function auditEmail(html: string) {
  return new MailAudit({ rules }).analyze(html);
}
```

---

## Development

```bash
npm install          # install dependencies
npm test             # run vitest test suite (46 tests)
npm run typecheck    # tsc --noEmit (strict mode)
npm run build        # tsup → dist/ (ESM + CJS + .d.ts)
npm run test:watch   # vitest in watch mode
```

The `rules/` directory contains the 56 JSON rule files shared with the PHP package. Any rule file added there is automatically picked up by `RuleLoader` — no registration needed.

---

## License

[MIT](LICENSE) — © 2026 rlnks
