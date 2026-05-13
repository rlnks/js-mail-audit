import { describe, it, expect, beforeEach } from 'vitest';
import { MailAudit } from '../src/MailAudit.js';
import type { AnalysisResult } from '../src/types.js';

// --- Helpers ---

function findInsight(result: AnalysisResult, id: string) {
  return result.insights.find((i) => i.id === id);
}

function assertTriggered(result: AnalysisResult, id: string, severity?: string) {
  const insight = findInsight(result, id);
  expect(insight, `Rule "${id}" should have triggered`).toBeDefined();
  if (severity) expect(insight!.severity).toBe(severity);
}

function assertNotTriggered(result: AnalysisResult, id: string) {
  const insight = findInsight(result, id);
  expect(insight, `Rule "${id}" should NOT have triggered`).toBeUndefined();
}

// --- Tests ---

describe('MailAudit', () => {
  let audit: MailAudit;

  beforeEach(() => {
    audit = new MailAudit();
  });

  // Core structure

  it('clean email scores 100', () => {
    const html   = '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="color:red;">Hello</td></tr></table>';
    const result = audit.analyze(html);
    expect(result.score).toBe(100);
    expect(result.insights).toHaveLength(0);
  });

  it('result has expected structure', () => {
    const result = audit.analyze('<table><tr><td>test</td></tr></table>');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('total_rules_checked');
    expect(result.summary).toHaveProperty('errors');
    expect(result.summary).toHaveProperty('warnings');
    expect(result.summary).toHaveProperty('infos');
    expect(result.summary).toHaveProperty('passed');
  });

  it('triggered insight has locations', () => {
    const result  = audit.analyze('<div style="display: flex;">test</div>');
    const insight = findInsight(result, 'no-flexbox');
    expect(insight).toBeDefined();
    expect(insight!.locations.length).toBeGreaterThan(0);
    const loc = insight!.locations[0]!;
    expect(loc).toHaveProperty('line');
    expect(loc).toHaveProperty('column');
    expect(loc).toHaveProperty('offset_start');
    expect(loc).toHaveProperty('offset_end');
    expect(loc.offset_end - loc.offset_start).toBeGreaterThan(0);
  });

  it('passed contains rules with success_message', () => {
    const html   = '<table role="presentation"><tr><td style="color:red;">Hello</td></tr></table>';
    const result = audit.analyze(html);
    const ids    = result.passed.map((p) => p.id);
    expect(ids).toContain('no-flexbox');
    expect(ids).toContain('no-script');
    expect(result.passed[0]).toHaveProperty('message');
  });

  it('score stays between 0 and 100', () => {
    const html   = '<div style="display:flex;"><svg></svg><form><input></form></div>';
    const result = audit.analyze(html);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('multi-locale returns message as record', () => {
    const multiAudit = new MailAudit({}, ['en', 'fr']);
    const result     = multiAudit.analyze('<div style="display: flex;">test</div>');
    const insight    = findInsight(result, 'no-flexbox');
    expect(insight).toBeDefined();
    expect(typeof insight!.message).toBe('object');
    const msg = insight!.message as Record<string, string>;
    expect(msg).toHaveProperty('en');
    expect(msg).toHaveProperty('fr');
    expect(typeof msg['en']).toBe('string');
    expect(typeof msg['fr']).toBe('string');
  });

  // CSS property rules

  it('no-flexbox triggers on display:flex', () => {
    assertTriggered(audit.analyze('<div style="display: flex;">x</div>'), 'no-flexbox', 'error');
  });

  it('no-grid triggers on display:grid', () => {
    assertTriggered(audit.analyze('<div style="display:grid;">x</div>'), 'no-grid', 'error');
  });

  it('no-css-variables triggers on var()', () => {
    assertTriggered(audit.analyze('<td style="color: var(--primary);">x</td>'), 'no-css-variables', 'error');
  });

  it('no-css-variables does not trigger on HTML comments', () => {
    assertNotTriggered(audit.analyze('<!-- var(--foo) --> <td style="color:red;">x</td>'), 'no-css-variables');
  });

  it('no-transform triggers on CSS transform', () => {
    assertTriggered(audit.analyze('<div style="transform: rotate(45deg);">x</div>'), 'no-transform');
  });

  it('no-transform does not trigger on text-transform', () => {
    assertNotTriggered(audit.analyze('<td style="text-transform: uppercase;">x</td>'), 'no-transform');
  });

  it('no-float triggers on float:left', () => {
    assertTriggered(audit.analyze('<div style="float:left;">x</div>'), 'no-float');
  });

  it('no-animation triggers on CSS animation', () => {
    assertTriggered(audit.analyze('<div style="animation: spin 1s linear;">x</div>'), 'no-animation');
  });

  // HTML tag rules

  it('no-script triggers on <script>', () => {
    assertTriggered(audit.analyze('<script>alert(1)</script>'), 'no-script', 'error');
  });

  it('no-form-elements triggers on <form>', () => {
    assertTriggered(audit.analyze('<form action="/"><input type="text"></form>'), 'no-form-elements', 'error');
  });

  it('no-video triggers on <video>', () => {
    assertTriggered(audit.analyze('<video src="x.mp4"></video>'), 'no-video', 'error');
  });

  it('no-svg triggers on <svg>', () => {
    assertTriggered(audit.analyze('<svg><circle r="5"/></svg>'), 'no-svg', 'error');
  });

  // HTML attribute missing

  it('img-dimensions triggers when width/height missing', () => {
    assertTriggered(audit.analyze('<img src="x.jpg" alt="test">'), 'img-dimensions');
  });

  it('img-dimensions does not trigger when width and height present', () => {
    assertNotTriggered(audit.analyze('<img src="x.jpg" width="200" height="100" alt="test">'), 'img-dimensions');
  });

  it('table-role-presentation triggers on table without role', () => {
    assertTriggered(audit.analyze('<table><tr><td>x</td></tr></table>'), 'table-role-presentation');
  });

  it('table-role-presentation does not trigger with role=presentation', () => {
    assertNotTriggered(audit.analyze('<table role="presentation"><tr><td>x</td></tr></table>'), 'table-role-presentation');
  });

  it('missing-alt-img triggers on img without alt', () => {
    assertTriggered(audit.analyze('<img src="x.jpg" width="100" height="100">'), 'missing-alt-img');
  });

  it('empty-alt-img triggers on img with empty alt', () => {
    assertTriggered(audit.analyze('<img src="x.jpg" width="100" height="100" alt="">'), 'empty-alt-img');
  });

  // Style block rules

  it('css-media-queries triggers on @media in style block', () => {
    assertTriggered(audit.analyze('<style>@media (max-width:600px){.x{color:red;}}</style>'), 'css-media-queries');
  });

  it('css-class-selectors triggers on .class in style block', () => {
    assertTriggered(audit.analyze('<style>.btn{color:red;}</style>'), 'css-class-selectors');
  });

  it('css-at-import triggers on @import', () => {
    assertTriggered(audit.analyze('<style>@import url("https://fonts.googleapis.com/css2?family=Open+Sans");</style>'), 'css-at-import');
  });

  // HTML content rules

  it('missing-https triggers on http:// src', () => {
    assertTriggered(audit.analyze('<img src="http://example.com/img.jpg">'), 'missing-https');
  });

  it('missing-https does not trigger on https://', () => {
    assertNotTriggered(audit.analyze('<img src="https://example.com/img.jpg" width="1" height="1" alt="">'), 'missing-https');
  });

  // Correlation rules

  it('font-no-fallback triggers when external font loaded without font-family stack', () => {
    assertTriggered(
      audit.analyze('<style>@import url("https://fonts.googleapis.com/css2?family=Open+Sans");</style><p>Hello</p>'),
      'font-no-fallback',
    );
  });

  it('font-no-fallback does not trigger when fallback stack present', () => {
    assertNotTriggered(
      audit.analyze('<style>@import url("https://fonts.googleapis.com/css2?family=Open+Sans");</style><p style="font-family:\'Open Sans\',Arial,sans-serif;">Hello</p>'),
      'font-no-fallback',
    );
  });

  // Preheader rules

  it('preheader-missing triggers on complete doc without preheader', () => {
    assertTriggered(audit.analyze('<html><body><p>Hello</p></body></html>'), 'preheader-missing');
  });

  it('preheader-missing does not trigger on fragment', () => {
    assertNotTriggered(audit.analyze('<p>Hello</p>'), 'preheader-missing');
  });

  it('preheader-missing does not trigger when preheader present', () => {
    const html = '<html><body><div style="display:none;overflow:hidden;">Preview text</div><p>Hello</p></body></html>';
    assertNotTriggered(audit.analyze(html), 'preheader-missing');
  });

  // Metric rules

  it('html-too-large triggers when HTML exceeds 102KB', () => {
    const html = '<p>' + 'x'.repeat(103000) + '</p>';
    assertTriggered(audit.analyze(html), 'html-too-large');
  });

  // DOM-specific rules

  it('heading-order triggers when heading levels are skipped', () => {
    assertTriggered(audit.analyze('<h1>Title</h1><h3>Subtitle</h3>'), 'heading-order');
  });

  it('heading-order does not trigger on sequential headings', () => {
    assertNotTriggered(audit.analyze('<h1>Title</h1><h2>Subtitle</h2><h3>Sub</h3>'), 'heading-order');
  });

  it('link-no-text triggers on <a> with no content', () => {
    assertTriggered(audit.analyze('<a href="https://example.com"></a>'), 'link-no-text');
  });

  it('link-no-text does not trigger on <a> with text', () => {
    assertNotTriggered(audit.analyze('<a href="https://example.com">Click here</a>'), 'link-no-text');
  });

  it('tracking-pixel triggers on 1x1 img', () => {
    assertTriggered(audit.analyze('<img src="https://track.example.com/open.gif" width="1" height="1" alt="">'), 'tracking-pixel');
  });

  it('tracking-pixel does not trigger on regular img', () => {
    assertNotTriggered(audit.analyze('<img src="x.jpg" width="200" height="100" alt="test">'), 'tracking-pixel');
  });

  it('email-max-width triggers on table wider than 600px', () => {
    assertTriggered(audit.analyze('<table width="650"><tr><td>x</td></tr></table>'), 'email-max-width');
  });

  it('email-max-width does not trigger on 600px table', () => {
    assertNotTriggered(audit.analyze('<table width="600" role="presentation"><tr><td style="color:red;">x</td></tr></table>'), 'email-max-width');
  });

  it('font-family-unquoted triggers on unquoted multi-word font', () => {
    assertTriggered(audit.analyze('<p style="font-family: Open Sans, Arial;">x</p>'), 'font-family-unquoted');
  });

  it('font-family-unquoted does not trigger on quoted font', () => {
    assertNotTriggered(audit.analyze('<p style="font-family: \'Open Sans\', Arial, sans-serif;">x</p>'), 'font-family-unquoted');
  });

  it('font-family-unquoted does not trigger on single-word font', () => {
    assertNotTriggered(audit.analyze('<p style="font-family: Arial, sans-serif;">x</p>'), 'font-family-unquoted');
  });
});
