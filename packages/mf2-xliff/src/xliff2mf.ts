import type * as MF from 'messageformat';
import type { MessageFormatInfo, MessageResourceData } from './index';
import type * as X from './xliff-spec';

import { parse } from './xliff';
import { fromNmtoken } from './nmtoken';

// TODO: Support declarations
export function xliff2mf(
  xliff: string | X.Xliff | X.XliffDoc
): { source: MessageFormatInfo; target?: MessageFormatInfo }[] {
  if (typeof xliff === 'string') xliff = parse(xliff);
  if (xliff.name !== 'xliff') xliff = xliff.elements[0];
  const xAttr = xliff.attributes;
  return xliff.elements.map(file => {
    const fr = resolveFile(file, xAttr);
    return xAttr.trgLang ? fr : { source: fr.source };
  });
}

function resolveFile(
  file: X.File,
  { srcLang, trgLang }: X.Xliff['attributes']
) {
  checkResegment(file);
  const id = parseId('f', file.attributes.id).key.join('.');
  const source: MessageFormatInfo = {
    id,
    locale: srcLang,
    data: new Map()
  };
  const target: MessageFormatInfo = {
    id,
    locale: trgLang || '',
    data: new Map()
  };
  for (const el of file.elements) {
    resolveEntry(el, source.data, target.data);
  }
  return { source, target };
}

const prettyElement = (name: string, id: string | undefined) =>
  id ? `<${name} id=${JSON.stringify(id)}>` : `<${name}>`;

function checkResegment({
  attributes,
  name
}: X.File | X.Group | X.Unit | X.Segment) {
  if (attributes?.canResegment === 'no') {
    const el = prettyElement(name, attributes.id);
    throw new Error(
      `xliff2mf conversion requires re-segmenting messages, but canResegment="no" is set for ${el}`
    );
  }
}

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

function resolveEntry(
  entry: ArrayElement<X.File['elements'] | X.Group['elements']>,
  source: MessageResourceData,
  target: MessageResourceData
) {
  switch (entry.name) {
    case 'group': {
      checkResegment(entry);
      const key = parseId('g', entry.attributes.id).key.at(-1)!;
      if (entry.elements) {
        const sg: MessageResourceData = new Map();
        const tg: MessageResourceData = new Map();
        source.set(key, sg);
        target.set(key, tg);
        for (const el of entry.elements) resolveEntry(el, sg, tg);
      }
      return;
    }

    case 'unit': {
      checkResegment(entry);
      const key = parseId('u', entry.attributes.id).key.at(-1)!;
      if (entry.attributes['mf:select']) {
        source.set(key, resolveSelectMessage(entry, 'source'));
        target.set(key, resolveSelectMessage(entry, 'target'));
      } else {
        source.set(key, resolvePatternMessage(entry, 'source'));
        target.set(key, resolvePatternMessage(entry, 'target'));
      }
      return;
    }
  }
}

function parseId(
  pre: 's',
  id: string | undefined
): { key: string[]; variant: MF.Variant['keys'] };
function parseId(
  pre: 'f' | 'g' | 'u',
  id: string | undefined
): { key: string[] };
function parseId(
  pre: 'f' | 'g' | 's' | 'u',
  id: string | undefined
): { key: string[]; variant?: MF.Variant['keys'] } {
  const match = id?.match(/(?:_[_:]|[^:])+/g);
  if (match && match.length >= 2 && match[0] === pre) {
    const keyMatch = match[1].match(/(?:_[_.]|[^.])+/g);
    const variantMatch = match[2]?.match(/(?:_[_.]|[^.])+/g);
    if (keyMatch && (pre !== 's' || variantMatch)) {
      return {
        key: keyMatch.map(fromNmtoken),
        variant: variantMatch?.map(v =>
          v === '_other'
            ? { type: '*' }
            : { type: 'literal', quoted: false, value: fromNmtoken(v) }
        )
      };
    }
  }
  const el = { f: 'file', g: 'group', s: 'segment', u: 'unit' }[pre];
  const pe = prettyElement(el, id);
  throw new Error(`Invalid id attribute for ${pe}`);
}

function resolveSelectMessage(
  { attributes, elements }: X.Unit,
  st: 'source' | 'target'
): MF.Message {
  if (!elements || elements.length === 0) {
    throw new Error(
      `Select ${prettyElement('unit', attributes.id)} cannot be empty`
    );
  }
  let rd: X.ResourceData | null = null;
  const variants: MF.Variant[] = [];
  for (const el of elements) {
    switch (el.name) {
      case 'res:resourceData':
        rd = el;
        break;
      case 'segment':
        variants.push({
          keys: parseId('s', el.attributes?.id).variant,
          value: resolvePattern(rd, el, st)
        });
        break;
    }
  }
  if (!rd) {
    const el = prettyElement('unit', attributes.id);
    throw new Error(`<mf:messageformat> not found in ${el}`);
  }
  const selIds = attributes['mf:select']?.trim().split(/\s+/) ?? [];
  const selectors = selIds.map(selId => {
    const ri = rd?.elements.find(exp => exp.attributes?.id === selId);
    const mfElements = ri?.elements?.find(el => el.name === 'res:source')
      ?.elements as X.MessageElements | undefined;
    if (!mfElements) {
      const el = prettyElement('unit', attributes.id);
      throw new Error(`Selector expression ${selId} not found in ${el}`);
    }
    return resolveExpression(mfElements);
  });
  return { type: 'select', declarations: [], selectors, variants };
}

function resolvePatternMessage(
  { elements }: X.Unit,
  st: 'source' | 'target'
): MF.PatternMessage {
  const pattern: MF.Pattern = [];
  if (elements) {
    let rd: X.ResourceData | null = null;
    for (const el of elements) {
      switch (el.name) {
        case 'res:resourceData':
          rd = el;
          break;
        case 'segment':
        case 'ignorable':
          pattern.push(...resolvePattern(rd, el, st));
          break;
      }
    }
  }
  return { type: 'message', declarations: [], pattern };
}

function resolvePattern(
  rd: X.ResourceData | null,
  { attributes, elements }: X.Segment | X.Ignorable,
  st: 'source' | 'target'
): MF.Pattern {
  const stel = elements[st === 'source' ? 0 : 1];
  if ((stel && stel.name !== st) || (!stel && st === 'source')) {
    const pe = prettyElement('segment', attributes?.id);
    throw new Error(`Expected to find a <${st}> inside ${pe}`);
  }
  return stel ? resolvePatternElements(rd, stel.elements) : [];
}

function resolvePatternElements(
  rd: X.ResourceData | null,
  elements: (X.Text | X.InlineElement)[]
): MF.Pattern {
  const pattern: MF.Pattern = [];
  for (const ie of elements) {
    const last = pattern.at(-1);
    const next = resolveInlineElement(rd, ie);
    if (typeof next === 'string') {
      if (typeof last === 'string') pattern[pattern.length - 1] += next;
      else pattern.push(next);
    } else {
      pattern.push(...next);
    }
  }
  return pattern;
}

const resolveCharCode = (cc: X.CharCode) =>
  String.fromCodePoint(Number(cc.attributes.hex));

function resolveInlineElement(
  rd: X.ResourceData | null,
  ie: X.Text | X.InlineElement
): string | Array<string | MF.Expression | MF.Markup> {
  switch (ie.type) {
    case 'text':
    case 'cdata':
      return ie.text;
    case 'element':
      switch (ie.name) {
        case 'cp':
          return resolveCharCode(ie);
        case 'ph':
        case 'sc':
        case 'ec':
          return [resolvePlaceholder(rd, ie)];
        case 'pc':
          return resolveSpanningCode(rd, ie);
      }
  }
  throw new Error(`Unsupported inline ${ie.type} <${ie.name}>`);
}

function resolveSpanningCode(
  rd: X.ResourceData | null,
  pc: X.CodeSpan
): Array<string | MF.Expression | MF.Markup> {
  const open = resolvePlaceholder(rd, pc);
  return [
    open,
    ...resolvePatternElements(rd, pc.elements),
    { type: 'markup', kind: 'close', name: open.name }
  ];
}

function resolvePlaceholder(
  rd: X.ResourceData | null,
  el: X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Markup;
function resolvePlaceholder(
  rd: X.ResourceData | null,
  el: X.Placeholder | X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Expression | MF.Markup;
function resolvePlaceholder(
  rd: X.ResourceData | null,
  el: X.Placeholder | X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Expression | MF.Markup {
  const { name } = el;
  const ref = el.attributes?.['mf:ref'];
  if (!ref) throw new Error(`Unsupported <${name}> without mf:ref attribute`);
  if (!rd) {
    throw new Error(
      `Inline <${name}> requires a preceding <mf:messageformat> in the same <unit>`
    );
  }
  const ri = rd.elements.find(el => el.attributes?.id === ref);
  const mfElements = ri?.elements?.find(el => el.name === 'res:source')
    ?.elements as X.MessageElements | undefined;
  if (!mfElements) {
    throw new Error(
      `MessageFormat value not found for <${name} mf:ref="${ref}">`
    );
  }
  if (mfElements[0].name === 'mf:markup') {
    const kind =
      name === 'ph' ? 'standalone' : name === 'ec' ? 'close' : 'open';
    return resolveMarkup(mfElements[0], kind);
  }
  if (name !== 'ph') {
    throw new Error('Only <ph> elements may refer to expression values');
  }
  return resolveExpression(mfElements);
}

const resolveText = (text: (X.Text | X.CharCode)[]) =>
  text.map(t => (t.type === 'element' ? resolveCharCode(t) : t.text)).join('');

function resolveExpression(elements: X.MessageElements): MF.Expression {
  const xArg = elements[0];
  let xFunc;
  let arg: MF.Literal | MF.VariableRef | undefined;
  switch (xArg.name) {
    case 'mf:literal':
    case 'mf:variable':
      arg = resolveValue(xArg);
      xFunc = elements[1];
      if (!xFunc) return { type: 'expression', arg };
      break;
    case 'mf:markup':
      throw new Error('Cannot reference markup as expression');
    default:
      xFunc = xArg;
      if (!xFunc) throw new Error('Invalid empty expression');
  }

  let annotation: MF.FunctionAnnotation | MF.UnsupportedAnnotation;
  if (xFunc.name === 'mf:function') {
    annotation = { type: 'function', name: xFunc.attributes.name };
    if (xFunc.elements?.length) {
      annotation.options = xFunc.elements.map(el => ({
        name: el.attributes.name,
        value: resolveValue(el.elements[0])
      }));
    }
  } else {
    annotation = {
      type: 'unsupported-annotation',
      sigil: xFunc.attributes.sigil ?? '�',
      source: resolveText(xFunc.elements)
    };
  }

  return arg
    ? { type: 'expression', arg, annotation }
    : { type: 'expression', annotation };
}

function resolveMarkup(
  part: X.MessageMarkup,
  kind: 'open' | 'standalone' | 'close'
) {
  const markup: MF.Markup = {
    type: 'markup',
    kind,
    name: part.attributes.name
  };
  if (kind !== 'close' && part.elements.length) {
    markup.options = part.elements.map(el => ({
      name: el.attributes.name,
      value: resolveValue(el.elements[0])
    }));
  }
  return markup;
}

function resolveValue(
  part: X.MessageLiteral | X.MessageVariable
): MF.Literal | MF.VariableRef {
  switch (part.name) {
    case 'mf:literal':
      return { type: 'literal', value: resolveText(part.elements) };
    case 'mf:variable':
      return { type: 'variable', name: part.attributes.name };
  }

  /* istanbul ignore next - never happens */
  // @ts-expect-error - Guard against unexpected <mf:option> contents
  throw new Error(`Unsupported value <${part.name}>`);
}
