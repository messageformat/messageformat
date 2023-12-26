import type * as MF from 'messageformat';
import type { MessageFormatInfo, MessageResourceData } from './index';
import type * as X from './xliff-spec';

import { parse } from './xliff';

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
  const { id } = file.attributes;
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
      const key = entry.attributes.name || entry.attributes.id;
      if (entry.elements) {
        if (entry.attributes['mf:select']) {
          source.set(key, resolveSelect(entry, 'source'));
          target.set(key, resolveSelect(entry, 'target'));
        } else {
          const sg: MessageResourceData = new Map();
          const tg: MessageResourceData = new Map();
          source.set(key, sg);
          target.set(key, tg);
          for (const el of entry.elements) resolveEntry(el, sg, tg);
        }
      }
      return;
    }

    case 'unit': {
      checkResegment(entry);
      const key = entry.attributes.name || entry.attributes.id;
      source.set(key, {
        type: 'message',
        declarations: [],
        pattern: resolvePattern(entry, 'source')
      });
      target.set(key, {
        type: 'message',
        declarations: [],
        pattern: resolvePattern(entry, 'target')
      });
      return;
    }

    case 'mf:messageformat':
      throw new Error(
        `Unexpected <mf:messageformat> in <group> without mf:select attribute`
      );
  }
}

const idList = (src: string | undefined) =>
  src ? src.trim().split(/\s+/) : [];

function resolveSelect(
  { attributes, elements }: X.Group,
  st: 'source' | 'target'
): MF.Message {
  if (!elements || elements.length === 0)
    throw new Error(
      `Select ${prettyElement('group', attributes.id)} cannot be empty`
    );
  let mf: X.MessageFormat | null = null;
  const variants: MF.Variant[] = [];
  for (const el of elements) {
    switch (el.name) {
      case 'mf:messageformat':
        mf = el;
        break;
      case 'unit': {
        const { id, name } = el.attributes;
        if (!name) {
          const pu = prettyElement('unit', id);
          throw new Error(`The name attribute is required for ${pu}`);
        }
        variants.push({
          keys: idList(name).map(id =>
            id === '*'
              ? { type: '*' }
              : { type: 'literal', quoted: false, value: id }
          ),
          value: resolvePattern(el, st)
        });
        break;
      }
      case 'group': {
        const pg = prettyElement('group', el.attributes.id);
        const ps = prettyElement('group mf:select', attributes.id);
        throw new Error(`Unexpected ${pg} in ${ps}`);
      }
    }
  }
  if (!mf) {
    const el = prettyElement('group', attributes.id);
    throw new Error(`<mf:messageformat> not found in ${el}`);
  }
  const selectors = idList(attributes['mf:select']).map(selId => {
    const exp = mf?.elements.find(exp => exp.attributes?.id === selId);
    if (!exp) {
      const el = prettyElement('group', attributes.id);
      throw new Error(`Selector ${selId} not found in ${el}`);
    }
    return resolveExpression(exp);
  });
  return { type: 'select', declarations: [], selectors, variants };
}

function resolvePattern(
  { attributes, elements }: X.Unit,
  st: 'source' | 'target'
): MF.Pattern {
  if (!elements) return { body: [] };
  let mf: X.MessageFormat | null = null;
  const body: MF.Pattern['body'] = [];
  for (const el of elements) {
    switch (el.name) {
      case 'mf:messageformat':
        mf = el;
        break;
      case 'segment':
      case 'ignorable': {
        const stel = el.elements[st === 'source' ? 0 : 1];
        if ((stel && stel.name !== st) || (!stel && st === 'source')) {
          const pe = prettyElement('unit', attributes.id);
          throw new Error(
            `Expected to find a <${st}> inside <${el.name}> of ${pe}`
          );
        }
        if (stel) {
          for (const ie of stel.elements) {
            const last = body[body.length - 1];
            const next = resolveInlineElement(ie, mf);
            if (typeof last === 'string' && typeof next === 'string') {
              body[body.length - 1] += next;
            } else {
              body.push(next);
            }
          }
        }
        break;
      }
    }
  }
  return { body };
}

const resolveCharCode = (cc: X.CharCode) =>
  String.fromCodePoint(Number(cc.attributes.hex));

function resolveInlineElement(
  ie: X.Text | X.InlineElement,
  mf: X.MessageFormat | null
): string | MF.Expression {
  switch (ie.type) {
    case 'text':
    case 'cdata':
      return ie.text;
    case 'element':
      switch (ie.name) {
        case 'cp':
          return resolveCharCode(ie);
        case 'ph':
          return resolveRef(mf, ie.attributes['mf:ref']);
        case 'pc':
        case 'sc':
        case 'ec':
        // TODO
      }
  }
  throw new Error(`Unsupported inline ${ie.type} <${ie.name}>`);
}

function resolveRef(
  mf: X.MessageFormat | null,
  ref: string | undefined
): MF.Expression {
  if (!ref) throw new Error('Unsupported <ph> without mf:ref attribute');
  if (!mf)
    throw new Error(
      'Inline <ph> requires a preceding <mf:messageformat> in the same <unit>'
    );
  const res = mf.elements.find(el => el.attributes?.id === ref);
  if (!res)
    throw new Error(`MessageFormat value not found for <ph mf:ref="${ref}">`);
  return resolveExpression(res);
}

const resolveText = (text: (X.Text | X.CharCode)[]) =>
  text.map(t => (t.type === 'element' ? resolveCharCode(t) : t.text)).join('');

function resolveExpression(part: X.MessageExpression): MF.Expression {
  const xArg = part.elements[0];
  let xFunc;
  let arg: MF.Literal | MF.VariableRef | undefined;
  switch (xArg.name) {
    case 'mf:literal':
    case 'mf:variable':
      arg = resolveValue(xArg);
      xFunc = part.elements[1];
      if (!xFunc) return { type: 'expression', arg };
      break;
    default:
      xFunc = xArg;
      if (!xFunc) throw new Error('Invalid empty expression');
  }

  let annotation: MF.FunctionAnnotation | MF.UnsupportedAnnotation;
  if (xFunc.name === 'mf:function') {
    annotation = {
      type: 'function',
      kind: 'value',
      name: xFunc.attributes.name
    };
    if (xFunc.elements.length) {
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
