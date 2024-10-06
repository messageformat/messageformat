import deepEqual from 'fast-deep-equal';
import type * as MF from 'messageformat';
import type * as X from './xliff-spec';
import { parse } from './xliff';
import { fromNmtoken } from './nmtoken';

export type ParsedUnit = {
  /** The same `file` object is used for all units in the same file. */
  file: { id: string; srcLang: string; trgLang?: string };
  key: string[];
  source: MF.Message;
  target?: MF.Message;
};

// TODO: Support declarations
export function* xliff2mf(
  xliff: string | X.Xliff | X.XliffDoc
): Generator<ParsedUnit, void> {
  if (typeof xliff === 'string') xliff = parse(xliff);
  if (xliff.name !== 'xliff') xliff = xliff.elements[0];
  const { srcLang, trgLang } = xliff.attributes;
  for (const file of xliff.elements) {
    const id = parseId('f', file.attributes.id).key.join('.');
    const fileInfo = { id, srcLang, trgLang };
    for (const el of file.elements) {
      yield* resolveEntry(fileInfo, el);
    }
  }
}

function* resolveEntry(
  file: ParsedUnit['file'],
  entry: X.File['elements'][number] | Required<X.Group>['elements'][number]
): Generator<ParsedUnit, void> {
  if (entry.elements) {
    switch (entry.name) {
      case 'group': {
        for (const el of entry.elements) yield* resolveEntry(file, el);
        break;
      }
      case 'unit': {
        const { key } = parseId('u', entry.attributes.id);
        const rd = entry.elements.find(el => el.name === 'res:resourceData') as
          | X.ResourceData
          | undefined;
        const { source, target } = entry.attributes['mf:select']
          ? resolveSelectMessage(rd, entry)
          : resolvePatternMessage(rd, entry);
        yield { file, key, source, target };
        break;
      }
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

const prettyElement = (name: string, id: string | undefined) =>
  id ? `<${name} id=${JSON.stringify(id)}>` : `<${name}>`;

function resolveSelectMessage(
  rd: X.ResourceData | undefined,
  { attributes, elements }: X.Unit
): { source: MF.SelectMessage; target?: MF.SelectMessage } {
  if (!rd) {
    const el = prettyElement('unit', attributes.id);
    throw new Error(`<res:resourceData> not found in ${el}`);
  }
  const source: MF.SelectMessage = {
    type: 'select',
    declarations: resolveDeclarations('source', rd),
    selectors: [],
    variants: []
  };
  const target: MF.SelectMessage = {
    type: 'select',
    declarations: resolveDeclarations('target', rd),
    selectors: [],
    variants: []
  };
  for (const el of elements!) {
    if (el.name === 'segment') {
      const keys = parseId('s', el.attributes?.id).variant;
      const pattern = resolvePattern(rd, el);
      source.variants.push({ keys, value: pattern.source });
      if (pattern.target) {
        target.variants.push({ keys: keys.slice(), value: pattern.target });
      }
    }
  }
  if (!source.variants.length) {
    const el = prettyElement('unit', attributes.id);
    throw new Error(`No variant <segment> elements found in ${el}`);
  }
  const hasTarget = !!target.variants.length;
  const srcSelectors: boolean[] = [];
  const tgtSelectors: boolean[] = [];
  for (const ref of attributes['mf:select']!.trim().split(/\s+/)) {
    const ri = rd.elements.find(
      ri =>
        ri.name === 'res:resourceItem' &&
        ri.attributes?.id === ref &&
        ri.attributes['mf:declaration']
    ) as X.ResourceItem | undefined;
    if (!ri) throw new Error(`Unresolved MessageFormat reference: ${ref}`);
    let srcSel = false;
    let tgtSel = false;
    for (const el of ri.elements) {
      if (el.name === 'res:source') {
        source.selectors.push({ type: 'variable', name: ref });
        srcSel = true;
      } else if (hasTarget && el.name === 'res:target') {
        target.selectors.push({ type: 'variable', name: ref });
        tgtSel = true;
      }
    }
    srcSelectors.push(srcSel);
    tgtSelectors.push(tgtSel);
  }

  if (srcSelectors.some(s => !s)) {
    for (const { keys } of source.variants) {
      for (let i = srcSelectors.length - 1; i >= 0; --i) {
        if (!srcSelectors[i]) keys.splice(i, 1);
      }
    }
    for (let i = 0; i < source.variants.length - 1; ++i) {
      const { keys } = source.variants[i];
      for (let j = source.variants.length - 1; j > i; --j) {
        if (deepEqual(keys, source.variants[j].keys)) {
          source.variants.splice(j, 1);
        }
      }
    }
  }
  if (tgtSelectors.some(s => !s)) {
    for (const { keys } of target.variants) {
      for (let i = tgtSelectors.length - 1; i >= 0; --i) {
        if (!tgtSelectors[i]) keys.splice(i, 1);
      }
    }
    for (let i = 0; i < target.variants.length - 1; ++i) {
      const { keys } = target.variants[i];
      for (let j = target.variants.length - 1; j > i; --j) {
        if (deepEqual(keys, target.variants[j].keys)) {
          target.variants.splice(j, 1);
        }
      }
    }
  }

  return { source, target: hasTarget ? target : undefined };
}

function resolvePatternMessage(
  rd: X.ResourceData | undefined,
  { elements }: X.Unit
): { source: MF.PatternMessage; target?: MF.PatternMessage } {
  const source: MF.Pattern = [];
  const target: MF.Pattern = [];
  let hasTarget = false;
  if (elements) {
    for (const el of elements) {
      switch (el.name) {
        case 'segment':
        case 'ignorable': {
          const pattern = resolvePattern(rd, el);
          source.push(...pattern.source);
          if (pattern.target) {
            target.push(...pattern.target);
            hasTarget = true;
          }
          break;
        }
      }
    }
  }
  return {
    source: {
      type: 'message',
      declarations: resolveDeclarations('source', rd),
      pattern: source
    },
    target: hasTarget
      ? {
          type: 'message',
          declarations: resolveDeclarations('target', rd),
          pattern: target
        }
      : undefined
  };
}

function resolveDeclarations(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined
): MF.Declaration[] {
  const declarations: MF.Declaration[] = [];
  for (const ri of rd?.elements ?? []) {
    if (ri.name === 'res:resourceItem' && ri.attributes['mf:declaration']) {
      const mfElements = getMessageElements(st, ri);
      if (mfElements.length) {
        const type = ri.attributes['mf:declaration'];
        const name = ri.attributes.id;
        const exp = resolveExpression(mfElements);
        if (type === 'input' && exp.arg?.type !== 'variable') {
          throw new Error(`Invalid .input declaration: ${name}`);
        }
        const value = exp as MF.Expression<MF.VariableRef>;
        declarations.push({ type, name, value });
      }
    }
  }
  return declarations;
}

function resolvePattern(
  rd: X.ResourceData | undefined,
  { name, attributes, elements }: X.Segment | X.Ignorable
): { source: MF.Pattern; target?: MF.Pattern } {
  let source: MF.Pattern | undefined;
  let target: MF.Pattern | undefined;
  for (const el of elements) {
    switch (el.name) {
      case 'source':
        source = resolvePatternElements('source', rd, el.elements);
        break;
      case 'target':
        target = resolvePatternElements('target', rd, el.elements);
        break;
    }
  }
  if (!source) {
    const pe = prettyElement(name, attributes?.id);
    throw new Error(`Expected to find a <source> inside ${pe}`);
  }
  return { source, target };
}

function resolvePatternElements(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined,
  elements: (X.Text | X.InlineElement)[]
): MF.Pattern {
  const pattern: MF.Pattern = [];
  for (const ie of elements) {
    const last = pattern.at(-1);
    const next = resolveInlineElement(st, rd, ie);
    if (typeof next === 'string') {
      if (typeof last === 'string') pattern[pattern.length - 1] += next;
      else pattern.push(next);
    } else {
      pattern.push(...next);
    }
  }
  return pattern;
}

function resolveInlineElement(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined,
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
          return [resolvePlaceholder(st, rd, ie)];
        case 'pc': {
          const open = resolvePlaceholder(st, rd, ie);
          return [
            open,
            ...resolvePatternElements(st, rd, ie.elements),
            { type: 'markup', kind: 'close', name: open.name }
          ];
        }
      }
  }
  throw new Error(`Unsupported inline ${ie.type} <${ie.name}>`);
}

function resolvePlaceholder(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined,
  el: X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Markup;
function resolvePlaceholder(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined,
  el: X.Placeholder | X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Expression | MF.Markup;
function resolvePlaceholder(
  st: 'source' | 'target',
  rd: X.ResourceData | undefined,
  el: X.Placeholder | X.CodeSpan | X.CodeSpanStart | X.CodeSpanEnd
): MF.Expression | MF.Markup {
  const { name } = el;
  const ref = el.attributes?.['mf:ref'];
  if (!ref) throw new Error(`Unsupported <${name}> without mf:ref attribute`);
  if (!rd) {
    const el = `<${name} mf:ref=${JSON.stringify(ref)}>`;
    throw new Error(
      `Resolving ${el} requires <res:resourceData> in the same <unit>`
    );
  }
  const ri = rd.elements.find(
    ri => ri.name === 'res:resourceItem' && ri.attributes?.id === ref
  ) as X.ResourceItem | undefined;

  if (ri?.attributes['mf:declaration']) {
    return { type: 'expression', arg: { type: 'variable', name: String(ref) } };
  }

  const mfElements = getMessageElements(st, ri);
  if (!mfElements.length) {
    throw new Error(`Unresolved MessageFormat reference: ${ref}`);
  }

  if (mfElements[0].name === 'mf:markup') {
    const kind =
      name === 'ph' ? 'standalone' : name === 'ec' ? 'close' : 'open';
    return resolveMarkup(mfElements[0], kind);
  }
  if (name === 'ph') return resolveExpression(mfElements);
  throw new Error(`Only <ph> elements may refer to expression values (${ref})`);
}

function getMessageElements(
  st: 'source' | 'target',
  ri: X.ResourceItem | undefined
) {
  let src: X.ResourceSource | undefined;
  let tgt: X.ResourceTarget | undefined;
  for (const el of ri?.elements ?? []) {
    if (el.name === 'res:source') src = el;
    else if (el.name === 'res:target') tgt = el;
  }
  const parent = st === 'target' ? (tgt ?? src) : src;
  return (parent?.elements?.filter(
    el => el.type === 'element' && el.name.startsWith('mf:')
  ) ?? []) as X.MessageElements;
}

function resolveExpression(elements: X.MessageElements): MF.Expression {
  let xArg: X.MessageLiteral | X.MessageVariable | undefined;
  let xFunc: X.MessageFunction | undefined;
  const attributes: MF.Attributes = new Map();
  for (const el of elements) {
    switch (el.name) {
      case 'mf:literal':
      case 'mf:variable':
        if (xArg) throw new Error('More than one value in an expression');
        xArg = el;
        break;
      case 'mf:function':
        if (xFunc) throw new Error('More than one function in an expression');
        xFunc = el;
        break;
      case 'mf:markup':
        throw new Error('Cannot reference markup as expression');
      case 'mf:attribute': {
        const aName = el.attributes.name;
        if (attributes.has(aName)) {
          throw new Error(`Duplicate attribute name: ${aName}`);
        }
        const value = el.elements?.find(el => el.type === 'element');
        if (value) {
          const rv = resolveValue(value);
          if (rv.type !== 'literal') {
            throw new Error(`Unsupported attribute value: ${value}`);
          }
          attributes.set(aName, rv);
        } else {
          attributes.set(aName, true);
        }
        break;
      }
    }
  }

  const arg = xArg ? resolveValue(xArg) : undefined;
  if (!xFunc) {
    if (!arg) throw new Error('Invalid empty expression');
    return { type: 'expression', arg, attributes };
  }

  const functionRef: MF.FunctionRef = {
    type: 'function',
    name: xFunc.attributes.name,
    options: resolveOptions(xFunc)
  };

  return arg
    ? { type: 'expression', arg, functionRef, attributes }
    : { type: 'expression', functionRef, attributes };
}

function resolveMarkup(
  part: X.MessageMarkup,
  kind: 'open' | 'standalone' | 'close'
): MF.Markup {
  return {
    type: 'markup',
    kind,
    name: part.attributes.name,
    options: kind !== 'close' ? resolveOptions(part) : undefined
  };
}

function resolveOptions(
  parent: X.MessageFunction | X.MessageMarkup
): MF.Options | undefined {
  const optEls = parent.elements?.filter(el => el.type === 'element');
  if (!optEls?.length) return undefined;
  const options: MF.Options = new Map();
  for (const el of optEls) {
    const name = el.attributes.name;
    if (options.has(name)) throw new Error(`Duplicate option name: ${name}`);
    options.set(
      name,
      resolveValue(el.elements.find(el => el.type === 'element'))
    );
  }
  return options;
}

function resolveValue(
  part: X.MessageLiteral | X.MessageVariable | undefined
): MF.Literal | MF.VariableRef {
  switch (part?.name) {
    case 'mf:literal':
      return { type: 'literal', value: resolveText(part.elements) };
    case 'mf:variable':
      return { type: 'variable', name: part.attributes.name };
  }

  throw new Error(`Unsupported value: ${part}`);
}

const resolveText = (text: (X.Text | X.CharCode)[]) =>
  text.map(t => (t.type === 'element' ? resolveCharCode(t) : t.text)).join('');

const resolveCharCode = (cc: X.CharCode) =>
  String.fromCodePoint(Number(cc.attributes.hex));
