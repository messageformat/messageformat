import deepEqual from 'fast-deep-equal';
import {
  isFunction,
  isLiteral,
  isMessage,
  isSelect,
  isTerm,
  isVariable,
  MessageFormat
} from 'messageformat';
import type * as MF from 'messageformat';
import type * as X from './xliff-spec';

let _id = 0;
const nextId = () => `m${++_id}`;

export function mf2xliff(
  source: MF.MessageFormat | MF.Resource,
  target?: MF.MessageFormat | MF.Resource
): X.Xliff {
  _id = 0;
  const attributes: X.Xliff['attributes'] = {
    version: '2.0',
    srcLang: '',
    xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
    'xmlns:mf': 'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet' // FIXME
  };
  const elements: X.File[] = [];
  if (source instanceof MessageFormat) {
    attributes.srcLang = source.locales[0];
    if (target instanceof MessageFormat) attributes.trgLang = target.locales[0];
    else if (target)
      throw new Error('source and target must be of the same type');
    for (const sr of source.resources) {
      const tr = target?.resources.find(res => res.id === sr.id);
      elements.push(resolveResource(sr, tr));
    }
  } else {
    attributes.srcLang = source.locale;
    if (target instanceof MessageFormat)
      throw new Error('source and target must be of the same type');
    else if (target) attributes.trgLang = target.locale;
    elements.push(resolveResource(source, target));
  }
  return { type: 'element', name: 'xliff', attributes, elements };
}

function resolveResource(
  source: MF.Resource,
  target: MF.Resource | undefined
): X.File {
  return {
    type: 'element',
    name: 'file',
    attributes: { id: `f:${source.id}`, 'mf:resourceId': source.id },
    elements: Object.entries(source.entries).map(([key, srcMsg]) =>
      resolveEntry([key], srcMsg, target?.entries[key])
    )
  };
}

const msgAttributes = (pre: 'g' | 'u', key: string[]) => ({
  id: `${pre}:${key.join('.').replace(/ +/g, '_')}`,
  name: key[key.length - 1]
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
  srcMsg: MF.Message | MF.MessageGroup,
  trgMsg: MF.Message | MF.MessageGroup | undefined
): X.Unit | X.Group {
  if (isMessage(srcMsg)) {
    if (trgMsg) {
      if (!isMessage(trgMsg)) throw new Error(mismatch(key));
      if (isSelect(srcMsg.value) || isSelect(trgMsg.value))
        return resolveSelect(key, srcMsg.value, trgMsg.value);
      else return resolvePattern(key, srcMsg.value, trgMsg.value);
    } else {
      return isSelect(srcMsg.value)
        ? resolveSelect(key, srcMsg.value, undefined)
        : resolvePattern(key, srcMsg.value, undefined);
    }
  }

  if (trgMsg && isMessage(trgMsg)) throw new Error(mismatch(key));
  return {
    type: 'element',
    name: 'group',
    attributes: msgAttributes('g', key),
    elements: Object.entries(srcMsg.entries).map(([k, srcMsg]) =>
      resolveEntry([...key, k], srcMsg, trgMsg?.entries[k])
    )
  };
}

function resolveSelect(
  key: string[],
  srcSel: MF.Part[] | MF.Select,
  trgSel: MF.Part[] | MF.Select | undefined
): X.Group {
  // We might be combining a Pattern and a Select, so let's normalise
  if (Array.isArray(srcSel)) {
    if (!trgSel || Array.isArray(trgSel))
      throw new Error(
        `At least one of source & target at ${key.join('.')} must be a select`
      );
    srcSel = { select: trgSel.select, cases: [{ key: [], value: srcSel }] };
  } else if (Array.isArray(trgSel))
    trgSel = { select: srcSel.select, cases: [{ key: [], value: trgSel }] };

  const select: {
    id: string;
    default: string | number;
    keys: (string | number)[];
  }[] = [];
  const parts: X.MessagePart[] = srcSel.select.map(sel => {
    const id = nextId();
    select.push({ id, default: sel.default ?? 'other', keys: [] });
    return resolveSelector(id, sel);
  });

  const elements: (X.MessageFormat | X.Unit)[] = [
    { type: 'element', name: 'mf:messageformat', elements: parts }
  ];

  if (!trgSel) {
    // If there's only a source, we use its cases directly
    for (const c of srcSel.cases)
      elements.push(
        resolvePattern([...key, c.key.join(' ')], c.value, undefined)
      );
  } else {
    // If the source and target have different selectors, it gets a bit complicated.
    // First, let's make sure that `selIds` and `parts` includes all the selectors
    // and that we have mappings between the array indices.
    const trgSelMap: number[] = [];
    for (const sel of trgSel.select) {
      const prevIdx = srcSel.select.findIndex(prev => deepEqual(sel, prev));
      if (prevIdx !== -1) trgSelMap.push(prevIdx);
      else {
        const id = nextId();
        select.push({ id, default: sel.default ?? 'other', keys: [] });
        trgSelMap.push(select.length - 1);
        parts.push(resolveSelector(id, sel));
      }
    }

    // Collect all of the key values for each case, in the right order
    const addSorted = (i: number, key: string | number) => {
      const { default: def, keys } = select[i];
      if (keys.includes(key)) return;
      if (key === def) keys.push(key);
      else if (typeof key === 'number') {
        let pos = 0;
        while (keys[pos] !== def && typeof keys[pos] === 'number') pos += 1;
        keys.splice(pos, 0, key);
      } else {
        let pos = keys.length;
        while (keys[pos - 1] === def) pos -= 1;
        keys.splice(pos, 0, key);
      }
    };
    for (const c of srcSel.cases)
      for (let i = 0; i < c.key.length; ++i) addSorted(i, c.key[i]);
    for (const c of trgSel.cases)
      for (let i = 0; i < c.key.length; ++i) addSorted(trgSelMap[i], c.key[i]);

    // Add a separate entry for each combined case
    // TODO: Collapse duplicates to default value only, where possible
    for (const sk of everyKey(select)) {
      const srcCase = srcSel.cases.find(c =>
        c.key.every((k, i) => k === sk[i] || k === select[i].default)
      );
      const trgCase = trgSel.cases.find(c =>
        c.key.every((k, i) => {
          const ti = trgSelMap[i];
          return k === sk[ti] || k === select[ti].default;
        })
      );
      if (!srcCase || !trgCase)
        throw new Error(`Case ${sk} not found‽ src:${srcCase} trg:${trgCase}`);
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

function resolveSelector(id: string, sel: MF.Selector) {
  const part = resolvePart(id, sel.value);
  if (typeof sel.default === 'string' || typeof sel.default === 'number')
    part.attributes = Object.assign({ default: sel.default }, part.attributes);
  return part;
}

function everyKey(
  select: { keys: MF.LiteralValue[] }[]
): Iterable<MF.LiteralValue[]> {
  let ptr: number[] | null = null;
  const max = select.map(s => s.keys.length - 1);
  function next(): IteratorResult<MF.LiteralValue[]> {
    if (!ptr) ptr = new Array<number>(select.length).fill(0);
    else {
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
  srcPattern: MF.Part[],
  trgPattern: MF.Part[] | undefined
): X.Unit {
  const parts: X.MessagePart[] = [];
  const handlePart = (p: MF.Part): X.Text | X.InlineElement => {
    if (isLiteral(p)) return asText(p);
    const id = nextId();
    const part = resolvePart(id, p);
    parts.push(part);
    const attributes = { id: id.substring(1), 'mf:ref': id };
    return { type: 'element', name: 'ph', attributes };
  };

  const se = srcPattern.map(handlePart);
  const source: X.Source = { type: 'element', name: 'source', elements: se };
  let ge: X.Segment['elements'];
  if (trgPattern) {
    const te = trgPattern.map(handlePart);
    const target: X.Target = { type: 'element', name: 'target', elements: te };
    ge = [source, target];
  } else ge = [source];
  const segment: X.Segment = { type: 'element', name: 'segment', elements: ge };

  const attributes = msgAttributes('u', key);
  let elements: X.Unit['elements'];
  if (parts.length > 0) {
    const name = 'mf:messageformat';
    const mf: X.MessageFormat = { type: 'element', name, elements: parts };
    elements = [mf, segment];
  } else elements = [segment];
  return { type: 'element', name: 'unit', attributes, elements };
}

function resolvePart(
  id: string | null,
  part: MF.Part | string | number | boolean
): X.MessagePart {
  const attributes = id ? { id } : undefined;

  if (isLiteral(part) || typeof part !== 'object') {
    return {
      type: 'element',
      name: 'mf:literal',
      attributes,
      elements: [asText(part)]
    };
  }

  if (isVariable(part)) {
    const elements = part.var_path.map(p => resolvePart(null, p));
    return { type: 'element', name: 'mf:variable', attributes, elements };
  }

  if (isFunction(part)) {
    const elements: (X.MessageOption | X.MessagePart)[] = [];
    if (part.options)
      for (const [name, value] of Object.entries(part.options))
        elements.push({
          type: 'element',
          name: 'mf:option',
          attributes: { name },
          elements: [asText(value)]
        });
    for (const p of part.args) elements.push(resolvePart(null, p));
    return {
      type: 'element',
      name: 'mf:function',
      attributes: Object.assign({ name: part.func }, attributes),
      elements
    };
  }

  if (isTerm(part)) {
    const elements: (X.MessageScope | X.MessagePart)[] = [];
    if (part.scope)
      for (const [name, value] of Object.entries(part.scope))
        elements.push({
          type: 'element',
          name: 'mf:scope',
          attributes: { name },
          elements: Array.isArray(value)
            ? value.map(v => resolvePart(null, v))
            : [resolvePart(null, value)]
        });
    for (const p of part.msg_path) elements.push(resolvePart(null, p));
    return {
      type: 'element',
      name: 'mf:message',
      attributes: Object.assign(
        part.res_id ? { resourceId: part.res_id } : {},
        attributes
      ),
      elements
    };
  }

  /* istanbul ignore next - never happens */
  throw new Error(`Unsupported part: ${JSON.stringify(part)}`);
}
