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

let _id = 0;
const nextId = () => `m${++_id}`;

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

const msgAttributes = (pre: 'g' | 'u', key: string[]) => ({
  id: `${pre}:${key.join('.').replace(/ +/g, '_')}`,
  name: key[key.length - 1] || key[key.length - 2] || ''
});

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
    if (trgMsg) {
      if (!isMessage(trgMsg)) throw new Error(mismatch(key));
      if (isSelectMessage(srcMsg) || isSelectMessage(trgMsg)) {
        return resolveSelect(key, srcMsg, trgMsg);
      } else {
        return resolvePattern(key, srcMsg.pattern, trgMsg.pattern);
      }
    } else {
      return isSelectMessage(srcMsg)
        ? resolveSelect(key, srcMsg, undefined)
        : resolvePattern(key, srcMsg.pattern, undefined);
    }
  }

  if (trgMsg && isMessage(trgMsg)) throw new Error(mismatch(key));
  return {
    type: 'element',
    name: 'group',
    attributes: msgAttributes('g', key),
    elements: Array.from(srcMsg).map(([k, srcMsg]) =>
      resolveEntry([...key, k], srcMsg, trgMsg?.get(k))
    )
  };
}

function resolveSelect(
  key: string[],
  srcSel: MF.Message,
  trgSel: MF.Message | undefined
): X.Group {
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

  const select: { id: string; keys: string[] }[] = [];
  const expressions: X.MessageExpression[] = srcSel.selectors.map(sel => {
    const id = nextId();
    select.push({ id, keys: [] });
    return resolveExpression(id, sel);
  });

  const elements: (X.MessageFormat | X.Unit)[] = [
    { type: 'element', name: 'mf:messageformat', elements: expressions }
  ];

  if (!trgSel) {
    // If there's only a source, we use its cases directly
    for (const v of srcSel.variants) {
      const vk = v.keys.map(k => (k.type === '*' ? '*' : k.value)).join(' ');
      elements.push(resolvePattern([...key, ...vk], v.value, undefined));
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
        expressions.push(resolveExpression(id, sel));
      }
    }

    // Collect all of the key values for each case, in the right order
    const addSorted = (i: number, key: MF.Literal | MF.CatchallKey) => {
      const { keys } = select[i];
      const sk = key.type === '*' ? '*' : key.value;
      if (keys.includes(sk)) return;
      if (sk === '*') {
        keys.push(sk);
      } else if (Number.isFinite(Number(sk))) {
        let pos = 0;
        while (keys[pos] !== '*' && Number.isFinite(Number(keys[pos]))) {
          pos += 1;
        }
        keys.splice(pos, 0, sk);
      } else {
        let pos = keys.length;
        while (keys[pos - 1] === '*') pos -= 1;
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
      elements.push(
        resolvePattern([...key, sk.join(' ')], srcCase.value, trgCase.value)
      );
    }
  }

  return {
    type: 'element',
    name: 'group',
    attributes: Object.assign(msgAttributes('g', key), {
      'mf:select': select.map(s => s.id).join(' ')
    }),
    elements
  };
}

function everyKey(select: { keys: string[] }[]): Iterable<string[]> {
  let ptr: number[] | null = null;
  const max = select.map(s => s.keys.length - 1);
  function next(): IteratorResult<string[]> {
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
  key: string[],
  srcPattern: MF.Pattern,
  trgPattern: MF.Pattern | undefined
): X.Unit {
  const refs: (X.MessageExpression | X.MessageMarkup)[] = [];
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
      refs.push(markup);
      openMarkup.unshift(markup);
      const name = p.kind === 'open' ? 'sc' : p.kind === 'close' ? 'ec' : 'ph';
      return { type: 'element', name, attributes };
    }
    const exp = resolveExpression(id, p);
    refs.push(exp);
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

  const se = srcPattern.body.map(handlePart);
  cleanMarkupSpans(se);
  const source: X.Source = { type: 'element', name: 'source', elements: se };
  let ge: X.Segment['elements'];
  if (trgPattern) {
    const te = trgPattern.body.map(handlePart);
    cleanMarkupSpans(te);
    const target: X.Target = { type: 'element', name: 'target', elements: te };
    ge = [source, target];
  } else {
    ge = [source];
  }
  const segment: X.Segment = { type: 'element', name: 'segment', elements: ge };

  const attributes = msgAttributes('u', key);
  let elements: X.Unit['elements'];
  if (refs.length > 0) {
    const name = 'mf:messageformat';
    const mf: X.MessageFormat = {
      type: 'element',
      name,
      elements: refs
    };
    elements = [mf, segment];
  } else {
    elements = [segment];
  }
  return { type: 'element', name: 'unit', attributes, elements };
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
