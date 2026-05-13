"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DetectorFactory: () => DetectorFactory,
  MailAudit: () => MailAudit
});
module.exports = __toCommonJS(index_exports);

// node_modules/tsup/assets/cjs_shims.js
var getImportMetaUrl = () => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.tagName.toUpperCase() === "SCRIPT" ? document.currentScript.src : new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();

// src/Loader/RuleLoader.ts
var import_node_fs = require("fs");
var import_node_path = require("path");
var import_node_url = require("url");
var RULES_DIR = (0, import_node_path.join)((0, import_node_path.dirname)((0, import_node_url.fileURLToPath)(importMetaUrl)), "..", "..", "rules");
var RuleLoader = class {
  constructor(bundledRules) {
    this.bundledRules = bundledRules;
  }
  bundledRules;
  load() {
    if (this.bundledRules) return this.bundledRules;
    return (0, import_node_fs.readdirSync)(RULES_DIR).filter((f) => f.endsWith(".json")).map((f) => JSON.parse((0, import_node_fs.readFileSync)((0, import_node_path.join)(RULES_DIR, f), "utf-8")));
  }
};

// src/Detection/AbstractDetector.ts
var AbstractDetector = class {
  matches(html, detection) {
    return this.findMatches(html, detection).length > 0;
  }
  buildLocation(html, offsetStart, length) {
    const before = html.slice(0, offsetStart);
    const line = before.split("\n").length;
    const lastNl = before.lastIndexOf("\n");
    const column = lastNl === -1 ? offsetStart + 1 : offsetStart - lastNl;
    return {
      line,
      column,
      offset_start: offsetStart,
      offset_end: offsetStart + length
    };
  }
  buildLocationsFromRegex(html, pattern) {
    const locations = [];
    for (const match of html.matchAll(pattern)) {
      const indices = match.indices;
      const offset = indices ? indices[0][0] : match.index;
      locations.push(this.buildLocation(html, offset, match[0].length));
    }
    return locations;
  }
  makeRegex(pattern, isRegex, flags = "dgi") {
    const src = isRegex ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(src, flags);
  }
};

// src/Detection/CssPropertyDetector.ts
var STYLE_ATTR = /style\s*=\s*(?:"([^"]*?)"|'([^']*?)')/dgi;
var STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/dgi;
var CssPropertyDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const locations = [];
    const isRegex = detection.regex === true;
    for (const pattern of detection.patterns ?? []) {
      const regex = this.makeRegex(pattern, isRegex);
      for (const attrMatch of html.matchAll(STYLE_ATTR)) {
        const attrIndices = attrMatch.indices;
        const content = attrMatch[1] ?? attrMatch[2] ?? "";
        const groupIndex = attrMatch[1] !== void 0 ? 1 : 2;
        const contentOffset = attrIndices ? attrIndices[groupIndex][0] : attrMatch.index + attrMatch[0].indexOf(content);
        for (const m of content.matchAll(new RegExp(regex.source, regex.flags))) {
          const mIndices = m.indices;
          const relOffset = mIndices ? mIndices[0][0] : m.index;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }
      for (const blockMatch of html.matchAll(STYLE_BLOCK)) {
        const blockIndices = blockMatch.indices;
        const content = blockMatch[1] ?? "";
        const contentOffset = blockIndices ? blockIndices[1][0] : blockMatch.index + blockMatch[0].indexOf(content);
        for (const m of content.matchAll(new RegExp(regex.source, regex.flags))) {
          const mIndices = m.indices;
          const relOffset = mIndices ? mIndices[0][0] : m.index;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }
    }
    return locations;
  }
};

// src/Detection/HtmlContentDetector.ts
var HtmlContentDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const locations = [];
    for (const pattern of detection.patterns ?? []) {
      const regex = this.makeRegex(pattern, detection.regex === true);
      locations.push(...this.buildLocationsFromRegex(html, regex));
    }
    return locations;
  }
};

// src/Detection/parse5Utils.ts
var import_parse5 = require("parse5");
function parseHtml(html) {
  return (0, import_parse5.parse)(html, { sourceCodeLocationInfo: true });
}
function* walkElements(node) {
  if ("tagName" in node) {
    yield node;
  }
  const children = "childNodes" in node ? node.childNodes : [];
  for (const child of children) {
    yield* walkElements(child);
  }
}
function getAttr(el, name) {
  return el.attrs.find((a) => a.name === name)?.value;
}
function getTextContent(el) {
  let text = "";
  for (const child of el.childNodes) {
    if (child.nodeName === "#text") {
      text += child.value;
    } else if ("childNodes" in child) {
      text += getTextContent(child);
    }
  }
  return text;
}

// src/Detection/HtmlTagDetector.ts
var HtmlTagDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const tags = new Set((detection.patterns ?? []).map((t) => t.toLowerCase().replace(/^<|>$/g, "")));
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (!tags.has(el.tagName)) continue;
      const loc = el.sourceCodeLocation;
      if (!loc) continue;
      locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
    }
    return locations;
  }
};

// src/Detection/HtmlTagWithStyleDetector.ts
var HtmlTagWithStyleDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const tag = (detection.tag ?? "").toLowerCase();
    const patterns = detection.css_patterns ?? [];
    const isRegex = detection.regex === true;
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (el.tagName !== tag) continue;
      const style = getAttr(el, "style") ?? "";
      if (!style) continue;
      const matched = patterns.some((p) => {
        const regex = this.makeRegex(p, isRegex, "i");
        return regex.test(style);
      });
      if (matched) {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }
    return locations;
  }
};

// src/Detection/HtmlAttributeMissingDetector.ts
var HtmlAttributeMissingDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const tag = (detection.tag ?? "").toLowerCase();
    const attributes = detection.attributes ?? [];
    const attrValue = detection.attribute_value;
    const onlyEmpty = detection.only_empty === true;
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (el.tagName !== tag) continue;
      for (const attr of attributes) {
        const value = getAttr(el, attr);
        let fires = false;
        if (onlyEmpty) {
          fires = value === "";
        } else if (attrValue !== void 0) {
          fires = value !== attrValue;
        } else {
          fires = value === void 0;
        }
        if (fires) {
          const loc = el.sourceCodeLocation;
          if (loc) {
            locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
          }
          break;
        }
      }
    }
    return locations;
  }
};

// src/Detection/StyleBlockDetector.ts
var STYLE_BLOCK2 = /<style[^>]*>([\s\S]*?)<\/style>/dgi;
var StyleBlockDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const locations = [];
    const isRegex = detection.regex === true;
    for (const blockMatch of html.matchAll(STYLE_BLOCK2)) {
      const blockIndices = blockMatch.indices;
      const content = blockMatch[1] ?? "";
      const contentOffset = blockIndices ? blockIndices[1][0] : blockMatch.index;
      for (const pattern of detection.patterns ?? []) {
        const regex = this.makeRegex(pattern, isRegex);
        for (const m of content.matchAll(regex)) {
          const mIndices = m.indices;
          const relOffset = mIndices ? mIndices[0][0] : m.index;
          locations.push(this.buildLocation(html, contentOffset + relOffset, m[0].length));
        }
      }
    }
    return locations;
  }
};

// src/Detection/CorrelationDetector.ts
var CorrelationDetector = class extends AbstractDetector {
  findMatches(html, detection) {
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
};

// src/Detection/PreheaderDetector.ts
var FILLER_PATTERN = /(&nbsp;|&zwnj;| |‌)+/gi;
var PreheaderDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const mode = detection.mode ?? "missing";
    if (mode === "missing") {
      if (!/<body[\s>]/i.test(html)) return [];
      const doc = parseHtml(html);
      for (const el of walkElements(doc)) {
        if (el.tagName !== "div") continue;
        const style = getAttr(el, "style") ?? "";
        if (/display\s*:\s*none/i.test(style) && /overflow\s*:\s*hidden/i.test(style)) {
          return [];
        }
      }
      return [{ line: 1, column: 1, offset_start: 0, offset_end: html.length }];
    }
    if (mode === "too_long") {
      const maxLength = detection.max_length ?? 150;
      const doc = parseHtml(html);
      for (const el of walkElements(doc)) {
        if (el.tagName !== "div") continue;
        const style = getAttr(el, "style") ?? "";
        if (/display\s*:\s*none/i.test(style) && /overflow\s*:\s*hidden/i.test(style)) {
          const raw = getTextContent(el);
          const text = raw.replace(FILLER_PATTERN, "").trim();
          if (text.length > maxLength) {
            const loc = el.sourceCodeLocation;
            if (loc) {
              return [this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset)];
            }
          }
        }
      }
    }
    return [];
  }
};

// src/Detection/HtmlMetricDetector.ts
var HtmlMetricDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    if (detection.metric === "size" && html.length > (detection.threshold ?? 102400)) {
      return [{ line: 1, column: 1, offset_start: 0, offset_end: html.length }];
    }
    return [];
  }
};

// src/Detection/HeadingOrderDetector.ts
var HEADING_TAGS = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
var HeadingOrderDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    void detection;
    const doc = parseHtml(html);
    const headings = [];
    for (const el of walkElements(doc)) {
      if (!HEADING_TAGS.has(el.tagName)) continue;
      const loc = el.sourceCodeLocation;
      if (!loc) continue;
      headings.push({ level: parseInt(el.tagName[1], 10), loc });
    }
    const locations = [];
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];
      if (curr.level > prev.level + 1) {
        locations.push(this.buildLocation(html, curr.loc.startOffset, curr.loc.endOffset - curr.loc.startOffset));
      }
    }
    return locations;
  }
};

// src/Detection/HtmlLinkNoTextDetector.ts
var HtmlLinkNoTextDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    void detection;
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (el.tagName !== "a") continue;
      const text = getTextContent(el).trim();
      if (text) continue;
      const hasDescriptiveImg = el.childNodes.some((child) => {
        if (!("tagName" in child) || child.tagName !== "img") return false;
        const alt = getAttr(child, "alt");
        return alt !== void 0 && alt.trim() !== "";
      });
      if (hasDescriptiveImg) continue;
      const loc = el.sourceCodeLocation;
      if (loc) {
        locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
      }
    }
    return locations;
  }
};

// src/Detection/HtmlTrackingPixelDetector.ts
var HtmlTrackingPixelDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    void detection;
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (el.tagName !== "img") continue;
      const w = getAttr(el, "width");
      const h = getAttr(el, "height");
      if (w === "1" && h === "1") {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }
    return locations;
  }
};

// src/Detection/CssFontFamilyDetector.ts
var FONT_FAMILY_DECL = /font-family\s*:\s*([^;}"']+)/dgi;
var UNQUOTED_MULTIWORD = /^[A-Za-z][A-Za-z0-9]*(?:\s+[A-Za-z][A-Za-z0-9]*)+/;
var CssFontFamilyDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    void detection;
    const locations = [];
    for (const match of html.matchAll(FONT_FAMILY_DECL)) {
      const indices = match.indices;
      const declOffset = indices ? indices[0][0] : match.index;
      const value = match[1] ?? "";
      for (const part of value.split(",")) {
        const trimmed = part.trim();
        if (/^['"]/.test(trimmed)) continue;
        if (UNQUOTED_MULTIWORD.test(trimmed)) {
          const partOffset = value.indexOf(part);
          locations.push(this.buildLocation(html, declOffset + partOffset, part.length));
          break;
        }
      }
    }
    return locations;
  }
};

// src/Detection/HtmlTableWidthDetector.ts
var HtmlTableWidthDetector = class extends AbstractDetector {
  findMatches(html, detection) {
    const maxWidth = detection.max_width ?? 600;
    const doc = parseHtml(html);
    const locations = [];
    for (const el of walkElements(doc)) {
      if (el.tagName !== "table") continue;
      const widthAttr = getAttr(el, "width");
      if (!widthAttr) continue;
      const px = parseInt(widthAttr, 10);
      if (!isNaN(px) && px > maxWidth) {
        const loc = el.sourceCodeLocation;
        if (loc) {
          locations.push(this.buildLocation(html, loc.startOffset, loc.endOffset - loc.startOffset));
        }
      }
    }
    return locations;
  }
};

// src/Detection/DetectorFactory.ts
var registry = {
  css_property: CssPropertyDetector,
  html_content: HtmlContentDetector,
  html_tag: HtmlTagDetector,
  html_tag_with_style: HtmlTagWithStyleDetector,
  html_attribute_missing: HtmlAttributeMissingDetector,
  style_block: StyleBlockDetector,
  correlation: CorrelationDetector,
  preheader: PreheaderDetector,
  html_metric: HtmlMetricDetector,
  heading_order: HeadingOrderDetector,
  link_no_text: HtmlLinkNoTextDetector,
  tracking_pixel: HtmlTrackingPixelDetector,
  css_font_family: CssFontFamilyDetector,
  table_max_width: HtmlTableWidthDetector
};
var DetectorFactory = class {
  static make(type) {
    const Ctor = registry[type];
    if (!Ctor) throw new Error(`Unknown detection type: "${type}"`);
    return new Ctor();
  }
  static register(type, ctor) {
    registry[type] = ctor;
  }
};

// src/Analysis/RuleEngine.ts
var RuleEngine = class {
  constructor(rules) {
    this.rules = rules;
  }
  rules;
  analyze(html) {
    const triggered = [];
    for (const rule of this.rules) {
      const type = rule.detection.type;
      if (!type) continue;
      try {
        const detector = DetectorFactory.make(type);
        const locations = detector.findMatches(html, rule.detection);
        if (locations.length > 0) {
          triggered.push({ ...rule, locations });
        }
      } catch {
      }
    }
    return triggered;
  }
};

// src/Analysis/ScoringEngine.ts
var MULTIPLIERS = {
  error: 1,
  warning: 0.6,
  info: 0.3
};
var ScoringEngine = class {
  calculate(triggered) {
    let deduction = 0;
    for (const rule of triggered) {
      const multiplier = MULTIPLIERS[rule.severity] ?? 0.5;
      deduction += rule.weight * multiplier;
    }
    return Math.max(0, Math.round(100 - deduction));
  }
};

// src/Feedback/FeedbackGenerator.ts
var FeedbackGenerator = class {
  constructor(locale = "en") {
    this.locale = locale;
  }
  locale;
  generate(triggered) {
    return triggered.map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      weight: rule.weight,
      message: this.resolve(rule.message),
      fix: this.resolve(rule.fix),
      ...rule.affected_clients ? { affected_clients: rule.affected_clients } : {},
      ...rule.tags ? { tags: rule.tags } : {},
      locations: rule.locations
    }));
  }
  generatePassed(rules) {
    const result = [];
    for (const rule of rules) {
      if (!rule.success_message) continue;
      result.push({
        id: rule.id,
        severity: rule.severity,
        message: this.resolve(rule.success_message),
        ...rule.tags ? { tags: rule.tags } : {}
      });
    }
    return result;
  }
  resolve(translations) {
    if (typeof this.locale === "string") {
      return translations[this.locale] ?? translations["en"] ?? "";
    }
    const out = {};
    for (const lang of this.locale) {
      out[lang] = translations[lang] ?? translations["en"] ?? "";
    }
    return out;
  }
};

// src/MailAudit.ts
var MailAudit = class {
  locale;
  bundledRules;
  constructor(config = {}, locale = "en") {
    this.locale = locale;
    this.bundledRules = config.rules;
  }
  analyze(html) {
    const rules = new RuleLoader(this.bundledRules).load();
    const triggered = new RuleEngine(rules).analyze(html);
    const passed = rules.filter((r) => !triggered.find((t) => t.id === r.id));
    const score = new ScoringEngine().calculate(triggered);
    const feedback = new FeedbackGenerator(this.locale);
    const insights = feedback.generate(triggered);
    const successes = feedback.generatePassed(passed);
    return {
      score,
      insights,
      passed: successes,
      summary: {
        total_rules_checked: rules.length,
        total_issues: triggered.length,
        errors: triggered.filter((r) => r.severity === "error").length,
        warnings: triggered.filter((r) => r.severity === "warning").length,
        infos: triggered.filter((r) => r.severity === "info").length,
        passed: successes.length
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DetectorFactory,
  MailAudit
});
//# sourceMappingURL=index.cjs.map