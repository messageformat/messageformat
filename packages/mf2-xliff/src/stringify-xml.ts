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

export function stringifyXML({ declaration, elements }: Doc) {
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
  res += stringifyElement(elements[0], 0);
  return res;
}

export function stringifyElement(
  { name, attributes, elements }: Element,
  level = 0
): string {
  let res = `<${name}`;
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        res += ` ${key}=${JSON.stringify(String(value))}`;
      }
    }
  }
  if (elements?.length) {
    res += '>';
    const hasText = elements.some(el => el.type === 'text');
    const indent = hasText ? '' : '\n' + '  '.repeat(level);
    for (const el of elements) {
      if (!hasText) res += indent + '  ';
      switch (el.type) {
        case 'cdata':
          res += `<![CDATA[${el.text}]]>`;
          break;
        case 'element':
          res += stringifyElement(el, level + 1);
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
