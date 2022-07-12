import type * as MF from 'messageformat';
import type { MessageFormatInfo } from './index';
import type * as X from './xliff-spec';

import { isExpression, isLiteral } from 'messageformat';
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
    data: { type: 'group', entries: {} }
  };
  const target: MessageFormatInfo = {
    id,
    locale: trgLang || '',
    data: { type: 'group', entries: {} }
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
  source: MF.MessageGroup,
  target: MF.MessageGroup
) {
  switch (entry.name) {
    case 'group': {
      checkResegment(entry);
      const key = entry.attributes.name || entry.attributes.id;
      if (entry.elements) {
        if (entry.attributes['mf:select']) {
          source.entries[key] = resolveSelect(entry, 'source');
          target.entries[key] = resolveSelect(entry, 'target');
        } else {
          const sg: MF.MessageGroup = { type: 'group', entries: {} };
          const tg: MF.MessageGroup = { type: 'group', entries: {} };
          source.entries[key] = sg;
          target.entries[key] = tg;
          for (const el of entry.elements) resolveEntry(el, sg, tg);
        }
      }
      return;
    }

    case 'unit': {
      checkResegment(entry);
      const key = entry.attributes.name || entry.attributes.id;
      source.entries[key] = {
        type: 'message',
        declarations: [],
        pattern: { body: resolveUnit(entry, 'source') }
      };
      target.entries[key] = {
        type: 'message',
        declarations: [],
        pattern: { body: resolveUnit(entry, 'target') }
      };
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
            id === '*' ? { type: '*' } : { type: 'nmtoken', value: id }
          ),
          value: { body: resolveUnit(el, st) }
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
    const part = mf?.elements.find(part => part.attributes?.id === selId);
    if (!part) {
      const el = prettyElement('group', attributes.id);
      throw new Error(`Selector ${selId} not found in ${el}`);
    }
    return resolvePart(part);
  });
  return { type: 'select', declarations: [], selectors, variants };
}

function resolveUnit(
  { attributes, elements }: X.Unit,
  st: 'source' | 'target'
): MF.PatternElement[] {
  if (!elements) return [];
  let mf: X.MessageFormat | null = null;
  let pattern: MF.PatternElement[] = [];
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
        if (stel) pattern = pattern.concat(resolveContents(stel.elements, mf));
        break;
      }
    }
  }
  return pattern;
}

function resolveContents(
  contents: (X.Text | X.InlineElement)[],
  mf: X.MessageFormat | null
) {
  const res: (MF.Literal | MF.VariableRef | MF.Expression)[] = [];
  for (const ie of contents) {
    const last = res[res.length - 1];
    const part = resolveInlineElement(ie, mf);
    if (isLiteral(last) && isLiteral(part)) last.value += part;
    else res.push(part);
  }
  return res;
}

const resolveCharCode = (cc: X.CharCode) =>
  String.fromCodePoint(Number(cc.attributes.hex));

function resolveInlineElement(
  ie: X.Text | X.InlineElement,
  mf: X.MessageFormat | null
): MF.Literal | MF.VariableRef | MF.Expression {
  switch (ie.type) {
    case 'text':
    case 'cdata':
      return { type: 'literal', value: ie.text };
    case 'element':
      switch (ie.name) {
        case 'cp':
          return { type: 'literal', value: resolveCharCode(ie) };
        case 'ph':
          return resolveRef(ie.name, ie.attributes['mf:ref'], mf);
        case 'pc': {
          const part = resolveRef(ie.name, ie.attributes['mf:ref'], mf);
          if (!isExpression(part))
            throw new Error(`<pc mf:ref> is only valid for function values`);
          const arg = resolveContents(ie.elements, mf);
          if (arg.length > 1)
            throw new Error(
              'Forming function arguments by concatenation is not supported'
            );
          const operand = arg[0];
          if (isExpression(operand))
            throw new Error(`A ${operand.type} is not supported here`);
          part.operand = operand;
          return part;
        }
        case 'sc':
        case 'ec':
        // TODO
      }
  }
  throw new Error(`Unsupported inline ${ie.type} <${ie.name}>`);
}

function resolveRef(
  name: string,
  ref: string | undefined,
  mf: X.MessageFormat | null
): MF.Literal | MF.VariableRef | MF.Expression {
  if (!ref) throw new Error(`Unsupported <${name}> without mf:ref attribute`);
  if (!mf)
    throw new Error(
      `Inline <${name}> requires a preceding <mf:messageformat> in the same <unit>`
    );
  const res = mf.elements.find(el => el.attributes?.id === ref);
  if (!res)
    throw new Error(
      `MessageFormat value not found for <${name} mf:ref="${ref}">`
    );
  return resolvePart(res);
}

const resolveText = (text: (X.Text | X.CharCode)[]) =>
  text.map(t => (t.type === 'element' ? resolveCharCode(t) : t.text)).join('');

function resolvePart(
  part: X.MessagePart
): MF.Literal | MF.VariableRef | MF.Expression {
  switch (part.name) {
    case 'mf:literal':
    case 'mf:variable':
      return resolveArgument(part);

    case 'mf:function': {
      let operand: MF.Expression['operand'] = undefined;
      const options: MF.Option[] = [];
      for (const el of part.elements) {
        if (el.name === 'mf:option') {
          options.push({ name: el.attributes.name, value: resolveOption(el) });
        } else if (operand) {
          throw new Error(
            `More than one positional argument is not supported.`
          );
        } else {
          operand = resolveArgument(el);
        }
      }

      return {
        type: 'expression',
        name: part.attributes.name,
        operand,
        options
      };
    }
  }

  /* istanbul ignore next - never happens */
  throw new Error(
    `Unsupported part ${(part as X.MessagePart).type} <${
      (part as X.MessagePart).name
    }>`
  );
}

function resolveArgument(part: X.MessageLiteral): MF.Literal;
function resolveArgument(part: X.MessageVariable): MF.VariableRef;
function resolveArgument(part: X.MessagePart): MF.Literal | MF.VariableRef;
function resolveArgument(part: X.MessagePart): MF.Literal | MF.VariableRef {
  switch (part.name) {
    case 'mf:literal':
      return { type: 'literal', value: resolveText(part.elements) };

    case 'mf:variable':
      return { type: 'variable', name: part.attributes.name };
  }

  /* istanbul ignore next - never happens */
  throw new Error(
    `Unsupported argument ${(part as X.MessagePart).type} <${
      (part as X.MessagePart).name
    }>`
  );
}

function resolveOption(opt: X.MessageOption): MF.Literal | MF.VariableRef {
  const sv = opt.elements.map(resolveArgument);
  switch (sv.length) {
    case 0:
      return { type: 'literal', value: '' };
    case 1:
      return sv[0];
    default:
      throw new Error('Options may only have one value');
  }
}
