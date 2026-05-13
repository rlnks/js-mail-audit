import type { DetectorInterface } from './DetectorInterface.js';
import { CssPropertyDetector } from './CssPropertyDetector.js';
import { HtmlContentDetector } from './HtmlContentDetector.js';
import { HtmlTagDetector } from './HtmlTagDetector.js';
import { HtmlTagWithStyleDetector } from './HtmlTagWithStyleDetector.js';
import { HtmlAttributeMissingDetector } from './HtmlAttributeMissingDetector.js';
import { StyleBlockDetector } from './StyleBlockDetector.js';
import { CorrelationDetector } from './CorrelationDetector.js';
import { PreheaderDetector } from './PreheaderDetector.js';
import { HtmlMetricDetector } from './HtmlMetricDetector.js';
import { HeadingOrderDetector } from './HeadingOrderDetector.js';
import { HtmlLinkNoTextDetector } from './HtmlLinkNoTextDetector.js';
import { HtmlTrackingPixelDetector } from './HtmlTrackingPixelDetector.js';
import { CssFontFamilyDetector } from './CssFontFamilyDetector.js';
import { HtmlTableWidthDetector } from './HtmlTableWidthDetector.js';

type DetectorCtor = new () => DetectorInterface;

const registry: Record<string, DetectorCtor> = {
  css_property:           CssPropertyDetector,
  html_content:           HtmlContentDetector,
  html_tag:               HtmlTagDetector,
  html_tag_with_style:    HtmlTagWithStyleDetector,
  html_attribute_missing: HtmlAttributeMissingDetector,
  style_block:            StyleBlockDetector,
  correlation:            CorrelationDetector,
  preheader:              PreheaderDetector,
  html_metric:            HtmlMetricDetector,
  heading_order:          HeadingOrderDetector,
  link_no_text:           HtmlLinkNoTextDetector,
  tracking_pixel:         HtmlTrackingPixelDetector,
  css_font_family:        CssFontFamilyDetector,
  table_max_width:        HtmlTableWidthDetector,
};

export class DetectorFactory {
  static make(type: string): DetectorInterface {
    const Ctor = registry[type];
    if (!Ctor) throw new Error(`Unknown detection type: "${type}"`);
    return new Ctor();
  }

  static register(type: string, ctor: DetectorCtor): void {
    registry[type] = ctor;
  }
}
