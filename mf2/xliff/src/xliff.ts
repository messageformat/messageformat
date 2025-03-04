import type { Xliff, XliffDoc } from './xliff-spec.ts';
import { parseXML, stringifyXML } from './xml.ts';

export function parse(src: string) {
  const doc = parseXML(src);
  if (
    !doc.elements ||
    doc.elements.length !== 1 ||
    doc.elements[0].name !== 'xliff'
  ) {
    throw new Error('Could not find <xliff> element in XML');
  }
  return doc as XliffDoc;
}

export function stringify(xliff: Xliff | XliffDoc) {
  const doc: XliffDoc = xliff.name === 'xliff' ? { elements: [xliff] } : xliff;
  return stringifyXML(doc);
}
