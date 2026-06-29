import { MessageFormat, type MessageFormatOptions } from 'messageformat';

export type MessageResource = {
  locale: string;
  messages: Messages;
};

export type Messages = { [key: string]: MessageGroup };

export type MessageGroup = {
  value?: MessageFormat;
  messages?: Messages;
};

export class MessageResourceParseError extends Error {
  pos: number;
  constructor(pos: number, message: string) {
    super(message);
    this.pos = pos;
  }
}

/** GLOBAL STATE: Current parser position */
let pos: number;

/** GLOBAL STATE: The full source being parsed */
let source: string;

/**
 * Parse input into a tree of MessageFormat instances.
 *
 * The frontmatter locale is required;
 * all other metadata is ignored.
 *
 * @param source - The full source being parsed
 * @param options - The options used for each MessageFormat isntance.
 */
export function parseMessageResource(
  source: string,
  options?: MessageFormatOptions
): MessageResource;
export function parseMessageResource(
  source_: string,
  options?: MessageFormatOptions
): MessageResource {
  pos = 0;
  source = source_;
  const locale = parseFrontmatter();
  const messages: Messages = Object.create(null);
  let section = messages;
  while (pos < source.length) {
    switch (source[pos]) {
      case '\t':
      case '\n':
      case '\r':
      case ' ':
        parseLineEnd('');
        break;
      case '#':
        parseComment();
        break;
      case '@':
        parseMetadata();
        break;
      case '[':
        pos += 1; // '['
        section = getOrCreateSection(messages, parseId('section'));
        if (source[pos] !== ']') {
          const msg = 'Invalid section identifier';
          throw new MessageResourceParseError(pos, msg);
        }
        pos += 1;
        parseLineEnd('section identifier');
        break;
      default: {
        const start = pos;
        const path = parseId('entry');
        const last = path.pop()!;
        const parent = getOrCreateSection(section, path);
        const self = (parent[last] ??= {});
        if ('value' in self) {
          throw new MessageResourceParseError(start, 'Message already defined');
        }
        self.value = parseValue(locale, options);
        break;
      }
    }
  }
  return { locale, messages };
}

export function getOrCreateSection(root: Messages, path: string[]): Messages {
  let section = root;
  for (const name of path) {
    const prev = section[name];
    if (prev) {
      section = prev.messages ??= Object.create(null);
    } else {
      const messages = Object.create(null);
      section[name] = { messages };
      section = messages;
    }
  }
  return section;
}

const localeMetadata = /^@locale[ \t]+([\w-]+)[ \t]*$/my;
function parseFrontmatter(): string {
  let locale = '';
  loop: while (pos < source.length) {
    switch (source[pos]) {
      case '\t':
      case '\n':
      case '\r':
      case ' ':
        parseLineEnd('');
        break;
      case '#':
        parseComment();
        break;
      case '@': {
        localeMetadata.lastIndex = pos;
        const m = localeMetadata.exec(source);
        if (m) {
          locale = m[1];
          pos = localeMetadata.lastIndex;
          parseLineEnd('metadata');
        } else {
          parseMetadata();
        }
        break;
      }
      case '-':
        if (source.startsWith('---', pos)) {
          pos += 3; // '---'
          parseLineEnd('frontmatter separator');
          if (!locale) {
            const msg = 'No locale metadata in resource frontmatter';
            throw new MessageResourceParseError(pos, msg);
          }
          return locale;
        }
      // fallthrough
      default:
        break loop;
    }
  }
  throw new MessageResourceParseError(pos, 'Missing resource frontmatter');
}

function parseComment() {
  const lf = source.indexOf('\n', pos + 1);
  pos = lf === -1 ? source.length : lf + 1;
}

const metadata = /[ \t].*(?:\r?\n|$)|\r?\n/y;
function parseMetadata() {
  parseComment();
  metadata.lastIndex = pos;
  while (metadata.exec(source)) pos = metadata.lastIndex;
}

function parseId(context: string): string[] {
  const id = [parseIdPart(context, true)];
  while (source[pos] === '.') {
    pos += 1;
    id.push(parseIdPart(context, false));
  }
  return id;
}

const idPart =
  /[\t ]*((?:[-a-zA-Z0-9_\u{A1}-\u{1FFF}\u{200C}-\u{200D}\u{2030}-\u{205E}\u{2070}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]|\\[\t\x20-\x2F\x3A-\x40\x5B-\x60nrt\x7B-\x7E\xA1-\xBF\xD7\xF7\u{2010}-\u{2027}\u{2030}-\u{205E}\u{2190}-\u{2BFF}]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{6})+)[\t ]*/uy;
const idEscape = /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{6}|.)/g;
function parseIdPart(context: string, first: boolean): string {
  idPart.lastIndex = pos;
  const m = idPart.exec(source);
  if (!m) {
    throw new MessageResourceParseError(pos, `Invalid ${context} identifier`);
  }
  const raw = m[1];
  if (first && raw.startsWith('---')) {
    throw new MessageResourceParseError(pos, 'Invalid frontmatter separator');
  }
  pos = idPart.lastIndex;
  return raw.replace(idEscape, esc => {
    switch (esc[1]) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case 'u':
      case 'U':
      case 'x':
        return String.fromCharCode(parseInt(esc.substring(2), 16));
      default:
        return esc[1];
    }
  });
}

const valueStart = /=[\t ]*/y;
const valueIndent = /[\t ]+|(?=\r?\n)/y;
const valueLine =
  /((?:[\t\x20-\x5B\x5D-\x7E\u{A0}-\u{2027}\u{202A}-\u{D7FF}\u{E000}-\u{10FFFF}]|\\[\t \\{|}nrt]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\U[0-9a-fA-F]{6})*)(?:\r?\n|$)/uy;
const valueEscape = /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{6}|.)/g;
function parseValue(
  locale: string,
  options: MessageFormatOptions | undefined
): MessageFormat {
  valueStart.lastIndex = pos;
  if (!valueStart.test(source)) {
    throw new MessageResourceParseError(pos, 'Invalid entry identifier');
  }

  pos = valueStart.lastIndex;

  valueLine.lastIndex = pos;
  const m = valueLine.exec(source);
  if (!m) throw new MessageResourceParseError(pos, 'Invalid entry value');
  const lines = m[1] ? [m[1]] : [];
  pos = valueLine.lastIndex;

  while (true) {
    valueIndent.lastIndex = pos;
    if (!valueIndent.test(source)) break;
    valueLine.lastIndex = valueIndent.lastIndex;
    const m = valueLine.exec(source);
    if (!m) throw new MessageResourceParseError(pos, 'Invalid entry value');
    if (lines.length > 0 || m[1]) lines.push(m[1]);
    pos = valueLine.lastIndex;
  }

  while (lines.at(-1) === '') lines.pop();
  const src = lines.join('\n').replace(valueEscape, esc => {
    switch (esc[1]) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case '\t':
      case 't':
        return '\t';
      case ' ':
        return ' ';
      case 'u':
      case 'U':
      case 'x':
        return String.fromCharCode(parseInt(esc.substring(2), 16));
      default:
        return esc;
    }
  });
  return new MessageFormat(locale, src, options);
}

/**
 * id-escape = backslash (escaped / symbols)
 * value-escape = backslash (escaped / "{" / "|" / "}")
 *
 * backslash = "\"
 * escaped = backslash
 *         / SP / HTAB
 *         / %s"n" / %s"r" / %s"t" ; represent LF, CR, HTAB
 *         / (%s"x" HEXDIG HEXDIG)
 *         / (%s"u" HEXDIG HEXDIG HEXDIG HEXDIG)
 *         / (%s"U" HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG HEXDIG)
 * symbols = %x21-2F / %x3A-40 / %x5B-60 / %x7B-7E ; ASCII symbols and punctuation
 *         / %xA1-BF / %xD7 / %xF7 ; Latin-1 symbols and punctuation
 *         / %x2010-2027 / %x2030-205E / %x2190-2BFF ; General symbols and punctuation
 */

const lineEnd = /[\t ]*\r?\n/y;
function parseLineEnd(context: string) {
  lineEnd.lastIndex = pos;
  if (lineEnd.exec(source)) {
    pos = lineEnd.lastIndex;
  } else if (pos < source.length) {
    const msg = context
      ? `Invalid ${context}: Unexpected content at line end`
      : 'Invalid indent';
    throw new MessageResourceParseError(pos, msg);
  }
}
