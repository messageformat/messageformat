import deepEqual from 'fast-deep-equal';
import {
  MessageFormat,
  isLiteral,
  isMessage,
  isSelectMessage,
  isVariableRef
} from 'messageformat';
import type * as MF from 'messageformat';
import type { MessageFormatInfo, MessageResourceData } from './index';
import type * as X from './xliff-spec';
import { toNmtoken } from './nmtoken';

let _id = 0;
const nextId = () => String(++_id);

const star = Symbol('*');

// TODO: Support declarations
export function mf2xliff(
  source: MessageFormatInfo,
  target?: MessageFormatInfo | undefined
): X.Xliff {
  _id = 0;
  const attributes: X.Xliff['attributes'] = {
    version: '2.0',
    srcLang: '',
    xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
    'xmlns:mf': 'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet' // FIXME
  };
  attributes.srcLang = source.locale;
  if (target instanceof MessageFormat) {
    throw new Error('source and target must be of the same type');
  } else if (target) {
    attributes.trgLang = target.locale;
  }

  const elements: (X.Unit | X.Group)[] = [];
  for (const [key, srcMsg] of source.data) {
    const trgMsg = target?.data.get(key);
    const entry = resolveEntry([key], srcMsg, trgMsg);
    elements.push(entry);
  }
  const file: X.File = {
    type: 'element',
    name: 'file',
    attributes: { id: msgId('f', [source.id]) },
    elements
  };

  return { type: 'element', name: 'xliff', attributes, elements: [file] };
}

function msgId(
  pre: 'f' | 'g' | 's' | 'u',
  key: string[],
  variant?: (string | typeof star)[]
) {
  const id = `${pre}:${key.map(toNmtoken).join('.')}`;
  return variant?.length
    ? `${id}:${variant
        .map(v => (typeof v === 'string' ? toNmtoken(v) : '_other'))
        .join('.')}`
    : id;
}

// TODO Add <cp> escapes
const asText = (value: unknown): X.Text => ({
  type: 'text',
  text: String(isLiteral(value) ? value.value : value)
});

const mismatch = (key: string[]) =>
  `Structure mismatch between source & target at ${key.join('.')}`;

function resolveEntry(
  key: string[],
  srcMsg: MF.Message | MessageResourceData,
  trgMsg: MF.Message | MessageResourceData | undefined
): X.Unit | X.Group {
  if (isMessage(srcMsg)) {
    if (trgMsg && !isMessage(trgMsg)) throw new Error(mismatch(key));
    return resolveMessage(key, srcMsg, trgMsg);
  }

  if (trgMsg && isMessage(trgMsg)) throw new Error(mismatch(key));
  return {
    type: 'element',
    name: 'group',
    attributes: { id: msgId('g', key), name: key.at(-1) },
    elements: Array.from(srcMsg).map(([k, srcMsg]) =>
      resolveEntry(k ? [...key, k] : key, srcMsg, trgMsg?.get(k))
    )
  };
}

function resolveMessage(
  key: string[],
  srcMsg: MF.Message,
  trgMsg: MF.Message | undefined
): X.Unit {
  if (isSelectMessage(srcMsg) || (trgMsg && isSelectMessage(trgMsg))) {
    return resolveSelect(key, srcMsg, trgMsg);
  }
  const rdElements = resolveDeclarations(srcMsg, trgMsg);
  const segment = resolvePattern(srcMsg.pattern, trgMsg?.pattern, rdElements);
  return buildUnit(key, rdElements, [segment]);
}

function buildUnit(
  key: string[],
  rdElements: X.ResourceItem[],
  segments: X.Segment[]
): X.Unit {
  let elements: X.Unit['elements'];
  if (rdElements.length > 0) {
    const rd: X.ResourceData = {
      type: 'element',
      name: 'res:resourceData',
      elements: rdElements
    };
    elements = [rd, ...segments];
  } else {
    elements = segments;
  }
  return {
    type: 'element',
    name: 'unit',
    attributes: { id: msgId('u', key), name: key.at(-1) },
    elements
  };
}

function resolveSelect(
  key: string[],
  srcSel: MF.Message,
  trgSel: MF.Message | undefined
): X.Unit {
  const rdElements = resolveDeclarations(srcSel, trgSel);

  // We might be combining a Pattern and a Select, so let's normalise
  if (!isSelectMessage(srcSel)) {
    srcSel = {
      type: 'select',
      declarations: [],
      selectors: [],
      variants: [{ keys: [], value: srcSel.pattern }]
    };
  }
  if (trgSel && !isSelectMessage(trgSel)) {
    trgSel = {
      type: 'select',
      declarations: [],
      selectors: [],
      variants: [{ keys: [], value: trgSel.pattern }]
    };
  }

  const select: { id: string; keys: (string | typeof star)[] }[] =
    srcSel.selectors.map(sel => ({ id: sel.name, keys: [] }));
  const segments: X.Segment[] = [];

  if (!trgSel) {
    // If there's only a source, we use its cases directly
    for (const v of srcSel.variants) {
      const segment = resolvePattern(v.value, undefined, rdElements);
      const vk = v.keys.map(k => (k.type === '*' ? star : k.value));
      segment.attributes = { id: msgId('s', key, vk) };
      segments.push(segment);
    }
  } else {
    // If the source and target have different selectors, it gets a bit complicated.
    // First, let's make sure that `selIds` and `parts` includes all the selectors
    // and that we have mappings between the array indices.
    const trgSelMap: number[] = [];
    for (const { name } of trgSel.selectors) {
      const prevIdx = srcSel.selectors.findIndex(prev => prev.name === name);
      if (prevIdx !== -1) {
        trgSelMap.push(prevIdx);
      } else {
        select.push({ id: name, keys: [] });
        trgSelMap.push(select.length - 1);
      }
    }

    // Collect all of the key values for each case, in the right order
    const addSorted = (i: number, key: MF.Literal | MF.CatchallKey) => {
      const { keys } = select[i];
      const sk = key.type === '*' ? star : key.value;
      if (keys.includes(sk)) return;
      if (sk === star) {
        keys.push(sk);
      } else if (Number.isFinite(Number(sk))) {
        let pos = 0;
        while (keys[pos] !== star && Number.isFinite(Number(keys[pos]))) {
          pos += 1;
        }
        keys.splice(pos, 0, sk);
      } else {
        let pos = keys.length;
        while (keys[pos - 1] === star) pos -= 1;
        keys.splice(pos, 0, sk);
      }
    };
    for (const c of srcSel.variants) {
      for (let i = 0; i < c.keys.length; ++i) addSorted(i, c.keys[i]);
    }
    for (const c of trgSel.variants) {
      for (let i = 0; i < c.keys.length; ++i) {
        addSorted(trgSelMap[i], c.keys[i]);
      }
    }

    // Add a separate entry for each combined case
    // TODO: Collapse duplicates to default value only, where possible
    for (const sk of everyKey(select)) {
      const srcCase = srcSel.variants.find(c =>
        c.keys.every((k, i) => k.type === '*' || k.value === sk[i])
      );
      const trgCase = trgSel.variants.find(c =>
        c.keys.every((k, i) => {
          const ti = trgSelMap[i];
          return k.type === '*' || k.value === sk[ti];
        })
      );
      if (!srcCase || !trgCase) {
        throw new Error(`Case ${sk} not found‽ src:${srcCase} trg:${trgCase}`);
      }
      const segment = resolvePattern(srcCase.value, trgCase.value, rdElements);
      segment.attributes = { id: msgId('s', key, sk) };
      segments.push(segment);
    }
  }

  const unit = buildUnit(key, rdElements, segments);
  unit.attributes.canResegment = 'no';
  unit.attributes['mf:select'] = select.map(s => s.id).join(' ');
  return unit;
}

function resolveDeclarations(
  srcMsg: MF.Message,
  trgMsg: MF.Message | undefined
): X.ResourceItem[] {
  const rdElements: X.ResourceItem[] = srcMsg.declarations.map(decl => {
    const elements = resolveExpression(decl.value!);
    return {
      type: 'element',
      name: 'res:resourceItem',
      attributes: {
        id: decl.name!,
        'mf:declaration': decl.type as 'input' | 'local'
      },
      elements: [{ type: 'element', name: 'res:source', elements }]
    };
  });
  for (const decl of trgMsg?.declarations ?? []) {
    const rt: X.ResourceTarget = {
      type: 'element',
      name: 'res:target',
      elements: resolveExpression(decl.value!)
    };
    const prev = rdElements.find(ri => ri.attributes.id === decl.name);
    if (prev) {
      if (prev.attributes['mf:declaration'] !== decl.type) {
        throw new Error(`Cannot mix declaration types for $${decl.name}`);
      }
      prev.elements.push(rt);
    } else {
      rdElements.push({
        type: 'element',
        name: 'res:resourceItem',
        attributes: {
          id: decl.name!,
          'mf:declaration': decl.type as 'input' | 'local'
        },
        elements: [rt]
      });
    }
  }
  return rdElements;
}

function addRef(
  rdElements: X.ResourceItem[],
  kind: 'source' | 'target',
  exp: MF.Markup
): { id: string; elements: [X.MessageMarkup, ...X.MessageAttribute[]] };
function addRef(
  rdElements: X.ResourceItem[],
  kind: 'source' | 'target',
  exp: MF.Expression | MF.Markup
): { id: string; elements: X.MessageElements };
function addRef(
  rdElements: X.ResourceItem[],
  kind: 'source' | 'target',
  exp: MF.Expression | MF.Markup
): { id: string; elements: X.MessageElements } {
  const resName = kind === 'source' ? 'res:source' : 'res:target';

  // For a bare variable reference, look for a matching declaration
  if (
    exp.type === 'expression' &&
    exp.arg?.type === 'variable' &&
    !exp.functionRef
  ) {
    const name = exp.arg.name;
    const prev = rdElements.find(ri => ri.attributes.id === name);
    if (prev) {
      const elements = (prev.elements.find(el => el.name === resName)
        ?.elements ?? []) as X.MessageElements;
      return { id: prev.attributes.id, elements };
    }
  }

  const elements =
    exp.type === 'expression' ? resolveExpression(exp) : resolveMarkup(exp);

  // Reuse previous references
  const prev = rdElements.find(ri =>
    ri.elements.some(
      el => el.name === resName && deepEqual(el.elements, elements)
    )
  );
  if (prev) return { id: prev.attributes.id, elements };
  if (kind === 'target') {
    const prevSource = rdElements.find(
      ri =>
        ri.elements.length === 1 &&
        ri.elements[0].name === 'res:source' &&
        deepEqual(ri.elements[0].elements, elements)
    );
    if (prevSource) {
      prevSource.elements.push({ type: 'element', name: resName, elements });
      return { id: prevSource.attributes.id, elements };
    }
  }

  // Add new reference with generated identifier
  const id = `ph:${nextId()}`;
  const ri: X.ResourceItem = {
    type: 'element',
    name: 'res:resourceItem',
    attributes: { id },
    elements: [{ type: 'element', name: resName, elements }]
  };
  rdElements.push(ri);
  return { id, elements };
}

function everyKey(
  select: { keys: (string | typeof star)[] }[]
): Iterable<(string | typeof star)[]> {
  let ptr: number[] | null = null;
  const max = select.map(s => s.keys.length - 1);
  function next(): IteratorResult<(string | typeof star)[]> {
    if (!ptr) {
      ptr = new Array<number>(select.length).fill(0);
    } else {
      for (let i = ptr.length - 1; i >= 0; --i) {
        if (ptr[i] < max[i]) {
          ptr[i] += 1;
          break;
        }
        if (i === 0) return { done: true, value: undefined };
        ptr[i] = 0;
      }
    }
    return { value: ptr.map((j, i) => select[i].keys[j]) };
  }
  return { [Symbol.iterator]: () => ({ next }) };
}

function resolvePattern(
  srcPattern: MF.Pattern,
  trgPattern: MF.Pattern | undefined,
  rdElements: X.ResourceItem[]
): X.Segment {
  const openMarkup: {
    id: string;
    markup: X.MessageMarkup;
    startRef: string;
  }[] = [];
  const handlePart = (
    kind: 'source' | 'target',
    p: string | MF.Expression | MF.Markup
  ): X.Text | X.InlineElement => {
    if (typeof p === 'string') return asText(p);
    if (p.type === 'markup') {
      let isolated: X.YesNo | undefined;
      if (p.kind === 'close') {
        const oi = openMarkup.findIndex(
          xm => xm.markup.attributes.name === p.name
        );
        if (oi === -1) {
          isolated = 'yes';
        } else {
          const [{ id, startRef }] = openMarkup.splice(oi, 1);
          return {
            type: 'element',
            name: 'ec',
            attributes: { startRef, 'mf:ref': id }
          };
        }
      }
      const { id, elements } = addRef(rdElements, kind, p);
      if (p.kind === 'open') {
        const startRef = nextId();
        openMarkup.unshift({ id, markup: elements[0], startRef });
        return {
          type: 'element',
          name: 'sc',
          attributes: { id: startRef, 'mf:ref': id }
        };
      } else {
        return {
          type: 'element',
          name: p.kind === 'close' ? 'ec' : 'ph',
          attributes: { id: nextId(), isolated, 'mf:ref': id }
        };
      }
    }
    const { id } = addRef(rdElements, kind, p);
    return {
      type: 'element',
      name: 'ph',
      attributes: { id: nextId(), 'mf:ref': id }
    };
  };
  const cleanMarkupSpans = (elements: (X.Text | X.InlineElement)[]) => {
    for (let i = 0; i < elements.length; ++i) {
      const sc = elements[i];
      if (sc.type !== 'element' || sc.name !== 'sc') continue;
      for (let j = i + 1; j < elements.length; ++j) {
        const ec = elements[j];
        if (
          ec.type === 'element' &&
          ec.name === 'ec' &&
          ec.attributes?.startRef === sc.attributes.id
        ) {
          const body = elements.splice(i + 1, j - i);
          body.pop();
          cleanMarkupSpans(body);
          Object.assign(sc, { name: 'pc', elements: body });
          break;
        }
      }
    }
  };

  const se = srcPattern.map(part => handlePart('source', part));
  cleanMarkupSpans(se);
  const source: X.Source = { type: 'element', name: 'source', elements: se };
  let ge: X.Segment['elements'];
  if (trgPattern) {
    const te = trgPattern.map(part => handlePart('target', part));
    cleanMarkupSpans(te);
    const target: X.Target = { type: 'element', name: 'target', elements: te };
    ge = [source, target];
  } else {
    ge = [source];
  }
  return { type: 'element', name: 'segment', elements: ge };
}

function resolveExpression({
  arg,
  functionRef,
  attributes
}: MF.Expression): X.MessageElements {
  let resFunc: X.MessageFunction | undefined;
  if (functionRef) {
    const elements: X.MessageFunction['elements'] = [];
    if (functionRef.options) {
      for (const [name, value] of functionRef.options) {
        elements.push({
          type: 'element',
          name: 'mf:option',
          attributes: { name },
          elements: [resolveArgument(value)]
        });
      }
    }
    const attributes = { name: functionRef.name };
    resFunc = { type: 'element', name: 'mf:function', attributes, elements };
  }

  let elements: X.MessageElements;
  if (arg) {
    const resArg = resolveArgument(arg);
    elements = resFunc ? [resArg, resFunc] : [resArg];
  } else {
    if (resFunc) elements = [resFunc];
    else throw new Error('Invalid empty expression');
  }
  if (attributes) {
    for (const [name, value] of attributes) {
      elements.push({
        type: 'element',
        name: 'mf:attribute',
        attributes: { name },
        elements: value === true ? undefined : [resolveArgument(value)]
      });
    }
  }
  return elements;
}

function resolveMarkup({ name, options, attributes }: MF.Markup) {
  const elements: X.MessageOption[] = [];
  if (options) {
    for (const [name, value] of options) {
      elements.push({
        type: 'element',
        name: 'mf:option',
        attributes: { name },
        elements: [resolveArgument(value)]
      });
    }
  }
  const mfElements: [X.MessageMarkup, ...X.MessageAttribute[]] = [
    { type: 'element', name: 'mf:markup', attributes: { name }, elements }
  ];
  if (attributes) {
    for (const [name, value] of attributes) {
      mfElements.push({
        type: 'element',
        name: 'mf:attribute',
        attributes: { name },
        elements: value === true ? undefined : [resolveArgument(value)]
      });
    }
  }
  return mfElements;
}

function resolveArgument(part: MF.Literal): X.MessageLiteral;
function resolveArgument(
  part: MF.Literal | MF.VariableRef
): X.MessageLiteral | X.MessageVariable;
function resolveArgument(
  part: MF.Literal | MF.VariableRef
): X.MessageLiteral | X.MessageVariable {
  if (isLiteral(part)) {
    return {
      type: 'element',
      name: 'mf:literal',
      elements: [asText(part)]
    };
  }

  if (isVariableRef(part)) {
    return {
      type: 'element',
      name: 'mf:variable',
      attributes: { name: part.name }
    };
  }

  throw new Error(`Unsupported part: ${JSON.stringify(part)}`);
}
