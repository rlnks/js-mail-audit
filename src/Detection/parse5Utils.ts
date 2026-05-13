import { parse, type DefaultTreeAdapterMap } from 'parse5';

export type Document = DefaultTreeAdapterMap['document'];
export type Element  = DefaultTreeAdapterMap['element'];
export type ChildNode = DefaultTreeAdapterMap['childNode'];

export function parseHtml(html: string): Document {
  return parse(html, { sourceCodeLocationInfo: true });
}

export function* walkElements(node: Document | Element | ChildNode): Generator<Element> {
  if ('tagName' in node) {
    yield node as Element;
  }
  const children: ChildNode[] = 'childNodes' in node
    ? (node as { childNodes: ChildNode[] }).childNodes
    : [];
  for (const child of children) {
    yield* walkElements(child);
  }
}

export function getAttr(el: Element, name: string): string | undefined {
  return el.attrs.find((a: { name: string; value: string }) => a.name === name)?.value;
}

export function getTextContent(el: Element): string {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeName === '#text') {
      text += (child as unknown as { value: string }).value;
    } else if ('childNodes' in child) {
      text += getTextContent(child as Element);
    }
  }
  return text;
}
