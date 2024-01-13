import deepEqual from 'fast-deep-equal';
import {
  MessageFormat,
  isFunctionAnnotation,
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
const nextId = () => `m${++_id}`;

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
    attributes: { id: `f:${source.id}`, 'mf:resourceId': source.id },
    elements
  };

  return { type: 'element', name: 'xliff', attributes, elements: [file] };
}

function msgId(
  pre: 'g' | 's' | 'u',
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
  const mfElements: X.MessageFormat['elements'] = [];
  const onRef = mfElements.push.bind(mfElements);
  const segment = resolvePattern(srcMsg.pattern, trgMsg?.pattern, onRef);
  return buildUnit(key, mfElements, [segment]);
}

function buildUnit(
  key: string[],
  mfElements: X.MessageFormat['elements'],
  segments: X.Segment[]
): X.Unit {
  let elements: X.Unit['elements'];
  if (mfElements.length > 0) {
    const name = 'mf:messageformat';
    const mf: X.MessageFormat = { type: 'element', name, elements: mfElements };
    elements = [mf, ...segments];
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
  // We might be combining a Pattern and a Select, so let's normalise
  if (isSelectMessage(srcSel)) {
    if (trgSel && !isSelectMessage(trgSel)) {
      trgSel = {
        type: 'select',
        declarations: [],
        selectors: srcSel.selectors,
        variants: [{ keys: [], value: trgSel.pattern }]
      };
    }
  } else {
    if (!trgSel || !isSelectMessage(trgSel)) {
      throw new Error(
        `At least one of source & target at ${key.join('.')} must be a select`
      );
    }
    srcSel = {
      type: 'select',
      declarations: [],
      selectors: trgSel.selectors,
      variants: [{ keys: [], value: srcSel.pattern }]
    };
  }

  const select: { id: string; keys: (string | typeof star)[] }[] = [];
  const mfElements: X.MessageFormat['elements'] = srcSel.selectors.map(sel => {
    const id = nextId();
    select.push({ id, keys: [] });
    return resolveExpression(id, sel);
  });
  const onRef = mfElements.push.bind(mfElements);
  const segments: X.Segment[] = [];

  if (!trgSel) {
    // If there's only a source, we use its cases directly
    for (const v of srcSel.variants) {
      const segment = resolvePattern(v.value, undefined, onRef);
      const vk = v.keys.map(k => (k.type === '*' ? star : k.value));
      segment.attributes = { id: msgId('s', key, vk) };
      segments.push(segment);
    }
  } else {
    // If the source and target have different selectors, it gets a bit complicated.
    // First, let's make sure that `selIds` and `parts` includes all the selectors
    // and that we have mappings between the array indices.
    const trgSelMap: number[] = [];
    for (const sel of trgSel.selectors) {
      const prevIdx = srcSel.selectors.findIndex(prev => deepEqual(sel, prev));
      if (prevIdx !== -1) {
        trgSelMap.push(prevIdx);
      } else {
        const id = nextId();
        select.push({ id, keys: [] });
        trgSelMap.push(select.length - 1);
        mfElements.push(resolveExpression(id, sel));
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
      const segment = resolvePattern(srcCase.value, trgCase.value, onRef);
      segment.attributes = { id: msgId('s', key, sk) };
      segments.push(segment);
    }
  }

  const unit = buildUnit(key, mfElements, segments);
  unit.attributes['mf:select'] = select.map(s => s.id).join(' ');
  return unit;
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
  onRef: (ref: X.MessageExpression | X.MessageMarkup) => void
): X.Segment {
  const openMarkup: X.MessageMarkup[] = [];
  const handlePart = (
    p: string | MF.Expression | MF.Markup
  ): X.Text | X.InlineElement => {
    if (typeof p === 'string') return asText(p);
    const id = nextId();
    const attributes: X.CodeSpanStart['attributes'] = {
      id: id.substring(1),
      'mf:ref': id
    };
    if (p.type === 'markup') {
      if (p.kind === 'close') {
        const oi = openMarkup.findIndex(xm => xm.attributes.name === p.name);
        if (oi === -1) {
          attributes.isolated = 'yes';
        } else {
          const [om] = openMarkup.splice(oi, 1);
          const { id } = om.attributes;
          return {
            type: 'element',
            name: 'ec',
            attributes: { startRef: id.substring(1), 'mf:ref': id }
          };
        }
      }
      const markup = resolveMarkup(id, p);
      onRef(markup);
      openMarkup.unshift(markup);
      const name = p.kind === 'open' ? 'sc' : p.kind === 'close' ? 'ec' : 'ph';
      return { type: 'element', name, attributes };
    }
    const exp = resolveExpression(id, p);
    onRef(exp);
    return { type: 'element', name: 'ph', attributes };
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

  const se = srcPattern.map(handlePart);
  cleanMarkupSpans(se);
  const source: X.Source = { type: 'element', name: 'source', elements: se };
  let ge: X.Segment['elements'];
  if (trgPattern) {
    const te = trgPattern.map(handlePart);
    cleanMarkupSpans(te);
    const target: X.Target = { type: 'element', name: 'target', elements: te };
    ge = [source, target];
  } else {
    ge = [source];
  }
  return { type: 'element', name: 'segment', elements: ge };
}

function resolveExpression(
  id: string,
  { arg, annotation }: MF.Expression
): X.MessageExpression {
  let resFunc: X.MessageFunction | X.MessageUnsupported | undefined;
  if (annotation) {
    if (isFunctionAnnotation(annotation)) {
      const elements: X.MessageFunction['elements'] = [];
      if (annotation.options) {
        for (const { name, value } of annotation.options) {
          elements.push({
            type: 'element',
            name: 'mf:option',
            attributes: { name },
            elements: [resolveArgument(value)]
          });
        }
      }
      const attributes = { name: annotation.name };
      resFunc = { type: 'element', name: 'mf:function', attributes, elements };
    } else {
      resFunc = {
        type: 'element',
        name: 'mf:unsupported',
        attributes: { sigil: annotation.sigil ?? '�' },
        elements: [asText(annotation.source ?? '�')]
      };
    }
  }

  let elements: X.MessageExpression['elements'];
  if (arg) {
    const resArg = resolveArgument(arg);
    elements = resFunc ? [resArg, resFunc] : [resArg];
  } else if (resFunc) {
    elements = [resFunc];
  } else {
    throw new Error('Invalid empty expression');
  }

  return {
    type: 'element',
    name: 'mf:expression',
    attributes: { id },
    elements
  };
}

function resolveMarkup(
  id: string,
  { name, options }: MF.Markup
): X.MessageMarkup {
  const elements: X.MessageOption[] = [];
  if (options) {
    for (const { name, value } of options) {
      elements.push({
        type: 'element',
        name: 'mf:option',
        attributes: { name },
        elements: [resolveArgument(value)]
      });
    }
  }
  return {
    type: 'element',
    name: 'mf:markup',
    attributes: { id, name },
    elements
  };
}

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
