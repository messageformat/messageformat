import deepEqual from 'fast-deep-equal';
import {
  isFunctionRef,
  isLiteral,
  isMessage,
  isMessageRef,
  isSelectMessage,
  isVariableRef,
  MessageFormat
} from 'messageformat';
import type * as MF from 'messageformat';
import type * as X from './xliff-spec';

let _id = 0;
const nextId = () => `m${++_id}`;

export function mf2xliff(
  source: MF.Resource,
  target?: MF.Resource | undefined
): X.Xliff {
  _id = 0;
  const attributes: X.Xliff['attributes'] = {
    version: '2.0',
    srcLang: '',
    xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
    'xmlns:mf': 'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet' // FIXME
  };
  attributes.srcLang = source.locale;
  if (target instanceof MessageFormat)
    throw new Error('source and target must be of the same type');
  else if (target) attributes.trgLang = target.locale;

  const elements: (X.Unit | X.Group)[] = [];
  for (const [key, srcMsg] of Object.entries(source.entries)) {
    const trgMsg = target?.entries[key];
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
      if (isSelectMessage(srcMsg) || isSelectMessage(trgMsg))
        return resolveSelect(key, srcMsg, trgMsg);
      else return resolvePattern(key, srcMsg.value, trgMsg.value);
    } else {
      return isSelectMessage(srcMsg)
        ? resolveSelect(key, srcMsg, undefined)
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
  srcSel: MF.Message,
  trgSel: MF.Message | undefined
): X.Group {
  // We might be combining a Pattern and a Select, so let's normalise
  if (isSelectMessage(srcSel)) {
    if (trgSel && !isSelectMessage(trgSel))
      trgSel = {
        type: 'select',
        select: srcSel.select,
        cases: [{ key: [], value: trgSel.value }]
      };
  } else {
    if (!trgSel || !isSelectMessage(trgSel))
      throw new Error(
        `At least one of source & target at ${key.join('.')} must be a select`
      );
    srcSel = {
      type: 'select',
      select: trgSel.select,
      cases: [{ key: [], value: srcSel.value }]
    };
  }

  const select: { id: string; default: string; keys: string[] }[] = [];
  const parts: X.MessagePart[] = srcSel.select.map(sel => {
    const id = nextId();
    select.push({ id, default: sel.fallback ?? 'other', keys: [] });
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
        select.push({ id, default: sel.fallback ?? 'other', keys: [] });
        trgSelMap.push(select.length - 1);
        parts.push(resolveSelector(id, sel));
      }
    }

    // Collect all of the key values for each case, in the right order
    const addSorted = (i: number, key: string) => {
      const { default: def, keys } = select[i];
      if (keys.includes(key)) return;
      if (key === def) keys.push(key);
      else if (Number.isFinite(Number(key))) {
        let pos = 0;
        while (keys[pos] !== def && Number.isFinite(Number(keys[pos])))
          pos += 1;
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
  if (typeof sel.fallback === 'string')
    part.attributes = Object.assign({ default: sel.fallback }, part.attributes);
  return part;
}

function everyKey(select: { keys: string[] }[]): Iterable<string[]> {
  let ptr: number[] | null = null;
  const max = select.map(s => s.keys.length - 1);
  function next(): IteratorResult<string[]> {
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
  srcPattern: MF.PatternElement[],
  trgPattern: MF.PatternElement[] | undefined
): X.Unit {
  const parts: X.MessagePart[] = [];
  const handlePart = (p: MF.PatternElement): X.Text | X.InlineElement => {
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
  part: MF.PatternElement
): X.MessagePart {
  const attributes = id ? { id } : undefined;

  if (isLiteral(part) || isVariableRef(part)) return resolveArgument(id, part);

  if (isFunctionRef(part)) {
    const elements: X.MessageFunction['elements'] = [];
    if (part.options)
      for (const [name, value] of Object.entries(part.options))
        elements.push({
          type: 'element',
          name: 'mf:option',
          attributes: { name },
          elements: [resolveArgument(null, value)]
        });
    for (const p of part.args) elements.push(resolveArgument(null, p));
    return {
      type: 'element',
      name: 'mf:function',
      attributes: Object.assign({ name: part.func }, attributes),
      elements
    };
  }

  if (isMessageRef(part)) {
    const elements: X.MessageReference['elements'] = [];
    if (part.scope)
      for (const [name, value] of Object.entries(part.scope))
        elements.push({
          type: 'element',
          name: 'mf:scope',
          attributes: { name },
          elements: [resolveArgument(null, value)]
        });
    for (const p of part.msg_path) elements.push(resolveArgument(null, p));
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

function resolveArgument(
  id: string | null,
  part: MF.Literal | MF.VariableRef | string | number | boolean
): X.MessageLiteral | X.MessageVariable {
  const attributes = id ? { id } : undefined;

  if (isLiteral(part) || typeof part !== 'object') {
    return {
      type: 'element',
      name: 'mf:literal',
      attributes,
      elements: [asText(part)]
    };
  }

  if (isVariableRef(part)) {
    const elements = part.var_path.map(p => resolveArgument(null, p));
    return { type: 'element', name: 'mf:variable', attributes, elements };
  }

  throw new Error(`Unsupported part: ${JSON.stringify(part)}`);
}
