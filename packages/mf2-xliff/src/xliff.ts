import { js2xml, Options, xml2js } from 'xml-js';
import type { Xliff, XliffDoc } from './xliff-spec';

export type ParseOptions = Options.XML2JS;
export type StringifyOptions = Options.JS2XML;

export function parse(src: string, options?: ParseOptions) {
  const opt = Object.assign({ ignoreComment: true }, options, {
    cdataKey: 'text',
    compact: false
  });
  const doc = xml2js(src, opt);
  if (
    !doc.elements ||
    doc.elements.length !== 1 ||
    doc.elements[0].name !== 'xliff'
  )
    throw new Error('Could not find <xliff> element in XML');
  return doc as XliffDoc;
}

export function stringify(xliff: Xliff | XliffDoc, options?: StringifyOptions) {
  const doc = xliff.name === 'xliff' ? { elements: [xliff] } : xliff;
  const opt = Object.assign({ spaces: 2 }, options, { compact: false });
  return js2xml(doc, opt);
}
