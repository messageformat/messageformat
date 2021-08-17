import type * as MF from 'messageformat';
import type * as X from './xliff-spec';

import {
  isFunction,
  isLiteral,
  isPlainStringLiteral,
  isTerm
} from 'messageformat';
import { parse } from './xliff';

export function xliff2mf(
  xliff: string | X.Xliff | X.XliffDoc
): { source: MF.Resource; target?: MF.Resource }[] {
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
  const source: MF.Resource = { id, locale: srcLang, entries: {} };
  const target: MF.Resource = { id, locale: trgLang || '', entries: {} };
  for (const el of file.elements) {
    resolveEntry(el, source, target);
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
          const sg: MF.MessageGroup = { entries: {} };
          const tg: MF.MessageGroup = { entries: {} };
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
        value: resolveUnit(entry, 'source')
      };
      target.entries[key] = {
        type: 'message',
        value: resolveUnit(entry, 'target')
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

function maybeNumber(str: string) {
  const n = Number(str);
  return Number.isFinite(n) ? n : str;
}

function resolveSelect(
  { attributes, elements }: X.Group,
  st: 'source' | 'target'
): MF.Message {
  if (!elements || elements.length === 0)
    throw new Error(
      `Select ${prettyElement('group', attributes.id)} cannot be empty`
    );
  let mf: X.MessageFormat | null = null;
  const cases: MF.SelectCase[] = [];
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
        const key = idList(name).map(maybeNumber);
        cases.push({ key, value: resolveUnit(el, st) });
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
  const select = idList(attributes['mf:select']).map(selId => {
    const part = mf?.elements.find(part => part.attributes?.id === selId);
    if (!part) {
      const el = prettyElement('group', attributes.id);
      throw new Error(`Selector ${selId} not found in ${el}`);
    }
    const def = part.attributes?.default;
    const value = resolvePart(part);
    return def ? { value, default: def } : { value };
  });
  return { type: 'select', value: { select, cases } };
}

function resolveUnit(
  { attributes, elements }: X.Unit,
  st: 'source' | 'target'
): MF.Pattern {
  if (!elements) return [];
  let mf: X.MessageFormat | null = null;
  let pattern: MF.Pattern = [];
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
): MF.Part[] {
  const res: MF.Part[] = [];
  for (const ie of contents) {
    const last = res[res.length - 1];
    const part = resolveInlineElement(ie, mf);
    if (isPlainStringLiteral(last) && isPlainStringLiteral(part))
      last.value += part;
    else res.push(part);
  }
  return res;
}

const resolveCharCode = (cc: X.CharCode) =>
  String.fromCodePoint(Number(cc.attributes.hex));

function resolveInlineElement(
  ie: X.Text | X.InlineElement,
  mf: X.MessageFormat | null
): MF.Part {
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
          if (!isFunction(part))
            throw new Error(`<pc mf:ref> is only valid for function values`);
          const arg = resolveContents(ie.elements, mf);
          if (arg.length > 1)
            throw new Error(
              'Forming function arguments by concatenation is not supported'
            );
          if (isFunction(arg[0]) || isTerm(arg[0]))
            throw new Error(`A ${arg[0].type} is not supported here`);
          part.args.unshift(arg[0] ?? '');
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
): MF.Part {
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

function resolvePart(part: X.MessagePart): MF.Part {
  switch (part.name) {
    case 'mf:literal':
    case 'mf:variable':
      return resolveArgument(part);

    case 'mf:function': {
      const fn: MF.Function = {
        type: 'function',
        func: part.attributes.name,
        args: []
      };
      const options: MF.FunctionOptions = {};
      let hasOptions = false;
      for (const el of part.elements) {
        if (el.name === 'mf:option') {
          options[el.attributes.name] = maybeNumber(resolveText(el.elements));
          hasOptions = true;
        } else fn.args.push(resolveArgument(el));
      }
      if (hasOptions) fn.options = options;
      return fn;
    }

    case 'mf:message': {
      const mt: MF.Term = { type: 'term', msg_path: [] };
      const scope: MF.MessageScope = {};
      let hasScope = false;
      for (const el of part.elements) {
        if (el.name === 'mf:scope') {
          scope[el.attributes.name] = resolveScopeOverride(el);
          hasScope = true;
        } else mt.msg_path.push(resolveArgument(el));
      }
      if (hasScope) mt.scope = scope;
      return mt;
    }
  }

  /* istanbul ignore next - never happens */
  throw new Error(
    `Unsupported part ${(part as X.MessagePart).type} <${
      (part as X.MessagePart).name
    }>`
  );
}

function resolveArgument(part: X.MessagePart): MF.Literal | MF.Variable {
  switch (part.name) {
    case 'mf:literal':
      return { type: 'literal', value: resolveText(part.elements) };

    case 'mf:variable':
      return { type: 'variable', var_path: part.elements.map(resolveArgument) };
  }

  /* istanbul ignore next - never happens */
  throw new Error(
    `Unsupported argument ${(part as X.MessagePart).type} <${
      (part as X.MessagePart).name
    }>`
  );
}

function resolveScopeOverride(el: X.MessageScope) {
  const sv = el.elements.map(resolveArgument);
  if (sv.length < 2) return sv[0] || '';
  else if (sv.every(isLiteral)) return sv.map(part => part.value);
  throw new Error(
    'Only literal parts are allowed in array values of scope overrides'
  );
}
