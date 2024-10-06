import { SaxesParser } from 'saxes';

export interface Doc {
  declaration?: {
    attributes?: Record<string, string | number | undefined>;
  };
  elements: [Element];
}

export interface Element {
  type: 'element';
  name: string;
  attributes?: Record<string, string | number | undefined>;
  elements?: (Element | Text)[];
}

export interface Text {
  type: 'text' | 'cdata';
  text: string;
}

export function parseXML(src: string): Doc {
  const parser = new SaxesParser();
  let declaration: Doc['declaration'];
  let elements: (Element | Text)[] = [];
  let xmlSpace = 'default';
  const elStack: Required<Element>[] = [];
  const xsStack: string[] = [];
  let level = -1;
  parser.on('xmldecl', decl => {
    declaration = { attributes: { ...decl } };
  });
  parser.on('opentag', ({ name, attributes }) => {
    const el: Required<Element> = {
      type: 'element',
      name,
      attributes,
      elements: []
    };
    elements.push(el);
    elements = el.elements;
    elStack[++level] = el;
    xsStack[level] = xmlSpace = attributes['xml:space'] ?? xmlSpace;
  });
  parser.on('closetag', () => {
    if (level > 0) {
      elements = elStack[--level].elements;
      xmlSpace = xsStack[level];
    }
  });
  parser.on('cdata', text => elements.push({ type: 'cdata', text }));
  parser.on('text', text => {
    if (xmlSpace === 'preserve' || /\S/.test(text)) {
      elements.push({ type: 'text', text });
    }
  });
  parser.write(src);
  return { declaration, elements: [elStack[0]] };
}

export function stringifyXML({ declaration, elements }: Doc): string {
  let res = '';
  if (declaration?.attributes) {
    res = '<?xml';
    for (const [key, value] of Object.entries(declaration.attributes)) {
      if (value !== undefined) {
        res += ` ${key}=${JSON.stringify(String(value))}`;
      }
    }
    res += '?>\n';
  }
  res += stringifyElement(elements[0]);
  return res;
}

export function stringifyElement(
  { name, attributes, elements }: Element,
  preserveSpace = false,
  level = 0
): string {
  let res = `<${name}`;
  let hasXmlSpace = false;
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        res += ` ${key}=${JSON.stringify(String(value))}`;
        if (key === 'xml:space') {
          preserveSpace = value === 'preserve';
          hasXmlSpace = true;
        }
      }
    }
  }
  if (elements?.length) {
    let allowIndent = !preserveSpace;
    if (!preserveSpace) {
      for (const el of elements) {
        if (el.type === 'text') {
          allowIndent = false;
          if (!hasXmlSpace && !preserveSpace && /^\s|\s\s|\s$/.test(el.text)) {
            preserveSpace = true;
            res += ' xml:space="preserve"';
          }
        }
      }
    }
    res += '>';
    const indent = allowIndent ? '\n' + '  '.repeat(level) : '';
    for (const el of elements) {
      if (allowIndent) res += indent + '  ';
      switch (el.type) {
        case 'cdata':
          res += `<![CDATA[${el.text}]]>`;
          break;
        case 'element':
          res += stringifyElement(el, preserveSpace, level + 1);
          break;
        case 'text':
          res += el.text;
          break;
      }
    }
    res += `${indent}</${name}>`;
  } else {
    res += '/>';
  }
  return res;
}
