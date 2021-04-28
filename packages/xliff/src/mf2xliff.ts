import {
  isFunctionReference,
  isLiteral,
  isMessage,
  isMessageReference,
  isSelect,
  isVariableReference,
  MessageFormat
} from 'messageformat';
import type * as MF from 'messageformat';
import type * as X from './xliff-spec';

let _id = 0;
const nextId = () => `m${++_id}`;

export function mf2xliff(mf: MF.MessageFormat | MF.Resource): X.Xliff {
  _id = 0;
  let srcLang: string;
  let elements: X.File[];
  if (mf instanceof MessageFormat) {
    srcLang = mf.locales[0];
    elements = mf.resources.map(handleResource);
  } else {
    srcLang = mf.locale;
    elements = [handleResource(mf)];
  }
  return {
    type: 'element',
    name: 'xliff',
    attributes: {
      version: '2.0',
      srcLang,
      xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
      'xmlns:mf':
        'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet' // FIXME
    },
    elements
  };
}

const handleResource = (res: MF.Resource): X.File => ({
  type: 'element',
  name: 'file',
  attributes: { id: `f:${res.id}` },
  elements: Object.entries(res.entries).map(([key, msg]) =>
    handleEntry([key], msg)
  )
});

const msgAttributes = (pre: 'g' | 'u', key: string[]) => ({
  id: `${pre}:${key.join('.').replace(/ +/g, '_')}`,
  name: key[key.length - 1]
});

// TODO Add <cp> escapes
const asText = (value: unknown): X.Text => ({
  type: 'text',
  text: String(value)
});

function handleEntry(
  key: string[],
  msg: MF.Message | MF.MessageGroup
): X.Unit | X.Group {
  if (isMessage(msg))
    return isSelect(msg.value)
      ? handleSelect(key, msg.value)
      : handlePattern(key, msg.value);

  return {
    type: 'element',
    name: 'group',
    attributes: msgAttributes('g', key),
    elements: Object.entries(msg.entries).map(([k, msg]) =>
      handleEntry([...key, k], msg)
    )
  };
}

function handleSelect(key: string[], sel: MF.Select): X.Group {
  const selSrc: string[] = [];
  const parts: X.MessagePart[] = sel.select.map(p => {
    const id = nextId();
    selSrc.push(id);
    const part = handlePart(id, p.value);
    if (isLiteral(p.default))
      part.attributes = Object.assign({ default: p.default }, part.attributes);
    return part;
  });

  const elements: (X.MessageFormat | X.Unit)[] = [
    { type: 'element', name: 'mf:messageformat', elements: parts }
  ];
  for (const c of sel.cases)
    elements.push(handlePattern([...key, c.key.join(' ')], c.value));

  return {
    type: 'element',
    name: 'group',
    attributes: Object.assign(msgAttributes('g', key), {
      'mf:select': selSrc.join(' ')
    }),
    elements
  };
}

function handlePattern(key: string[], pattern: MF.Part[]): X.Unit {
  const parts: X.MessagePart[] = [];
  const source: X.Source = { type: 'element', name: 'source', elements: [] };
  for (const p of pattern) {
    if (isLiteral(p)) source.elements.push(asText(p));
    else {
      const id = nextId();
      const part = handlePart(id, p);
      parts.push(part);
      const attributes = { id: id.substring(1), 'mf:ref': id };
      source.elements.push({ type: 'element', name: 'ph', attributes });
    }
  }
  const elements: (X.MessageFormat | X.Segment)[] = [
    { type: 'element', name: 'segment', elements: [source] }
  ];
  if (parts.length > 0)
    elements.unshift({
      type: 'element',
      name: 'mf:messageformat',
      elements: parts
    });
  return {
    type: 'element',
    name: 'unit',
    attributes: msgAttributes('u', key),
    elements
  };
}

function handlePart(id: string | null, part: MF.Part | boolean): X.MessagePart {
  const attributes = id ? { id } : undefined;

  if (isLiteral(part) || typeof part === 'boolean') {
    return {
      type: 'element',
      name: 'mf:literal',
      attributes,
      elements: [asText(part)]
    };
  }

  if (isVariableReference(part)) {
    const elements = part.var_path.map(p => handlePart(null, p));
    return { type: 'element', name: 'mf:variable', attributes, elements };
  }

  if (isFunctionReference(part)) {
    const elements: (X.MessageOption | X.MessagePart)[] = [];
    if (part.options)
      for (const [name, value] of Object.entries(part.options))
        elements.push({
          type: 'element',
          name: 'mf:option',
          attributes: { name },
          elements: [asText(value)]
        });
    for (const p of part.args) elements.push(handlePart(null, p));
    return {
      type: 'element',
      name: 'mf:function',
      attributes: Object.assign({ name: part.func }, attributes),
      elements
    };
  }

  if (isMessageReference(part)) {
    const elements: (X.MessageScope | X.MessagePart)[] = [];
    if (part.scope)
      for (const [name, value] of Object.entries(part.scope))
        elements.push({
          type: 'element',
          name: 'mf:scope',
          attributes: { name },
          elements: Array.isArray(value)
            ? value.map(v => handlePart(null, v))
            : [handlePart(null, value)]
        });
    for (const p of part.msg_path) elements.push(handlePart(null, p));
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
