// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CST {
  export type Resource = Array<EmptyLine | Comment | SectionHead | Entry>;

  export type EmptyLine = { type: 'empty-line'; range: Range };
  export type Comment = {
    type: 'comment';
    /** Does not include the `#` or the line terminator. */
    content: string;
    range: Range;
  };
  export type SectionHead = {
    type: 'section-head';
    id: Id;
    /** The position of the `]`, or -1 if not found. */
    close: number;
    /** `start` indicates the position of the `[`. */
    range: Range;
  };
  export type Entry = {
    type: 'entry';
    id: Id;
    /** The position of the `=`, or -1 if not found. */
    equal: number;
    value: Value;
    range: Range;
  };

  export type Id = { raw: IdPart[]; value: string[]; range: Range };
  export type IdPart = Content | Escape | IdDot;
  export type IdDot = { type: 'dot'; range: Range };

  export type Value = { raw: ValuePart[][]; value: string; range: Range };
  export type ValuePart = Content | Escape;
  export type Content = { type: 'content'; value: string; range: Range };
  export type Escape = {
    type: 'escape';
    /** Does not include the `\`. */
    raw: string;
    range: Range;
  };

  /** `[start, end)` includes any trailing line terminator */
  export type Range = [start: number, end: number];
}

/** GLOBAL STATE: Error handler */
let onError: (range: CST.Range, msg: string) => void;

/** GLOBAL STATE: Current parser position */
let pos: number;

/** GLOBAL STATE: Seen identifier paths */
let prevIdPaths: Array<{ path: string[]; error: boolean; range: CST.Range }>;

/** GLOBAL STATE: The full source being parsed */
let source: string;

/**
 * Parse input into a MessageResource CST.
 * Should never throw an Error.
 *
 * @param source - The full source being parsed
 * @param onError - Error handler, may be called multiple times for bad input.
 */
export function parseCST(
  source: string,
  onError: (range: CST.Range, msg: string) => void
): CST.Resource;

// resource = line *(newline line)
// line = section-head / entry / comment / empty-line
export function parseCST(
  source_: string,
  onError_: (range: CST.Range, msg: string) => void
): CST.Resource {
  if (!source_) return [{ type: 'empty-line', range: [0, 0] }];
  const res: CST.Resource = [];
  onError = onError_;
  pos = 0;
  prevIdPaths = [];
  source = source_;
  let sectionId: string[] = [];
  while (pos < source.length) {
    switch (source[pos]) {
      case '\n':
      case '\r':
      case '\t':
      case ' ':
        res.push(parseEmptyLine());
        break;
      case '#':
        res.push(parseComment());
        break;
      case '[':
        {
          const sh = parseSectionHead();
          res.push(sh);
          sectionId = sh.id.value;
        }
        break;
      default:
        res.push(parseEntry(sectionId));
        break;
    }
  }
  return res;
}

// empty-line = [ws]
function parseEmptyLine(): CST.EmptyLine {
  const type = 'empty-line';
  const start = pos;
  parseWhitespace();
  parseLineEnd(type);
  return { type, range: [start, pos] };
}

// comment = "#" *(content / backslash)
function parseComment(): CST.Comment {
  const start = pos;
  pos += 1; // '#'
  let lf = source.indexOf('\n', pos);
  let content: string;
  if (lf === -1) {
    content = source.substring(pos);
    pos = source.length;
  } else {
    pos = lf + 1;
    if (source[lf - 1] === '\r') lf -= 1;
    content = source.substring(start + 1, lf);
  }
  return { type: 'comment', content, range: [start, pos] };
}

// section-head = "[" [ws] id [ws] "]" [ws]
function parseSectionHead(): CST.SectionHead {
  const type = 'section-head';
  const start = pos;
  pos += 1; // '['
  const id = parseId();
  checkId(type, [], id);
  const close = parseChar(']');
  parseWhitespace();
  parseLineEnd(type);
  return { type, id, close, range: [start, pos] };
}

/**
 * entry = id [ws] "=" [ws] value
 * value = value-line *(newline ws value-line)
 * value-line = [(value-start / value-escape) *(content / value-escape)]
 * value-start = %x21-5B / %x5D-7E / %x00A0-2027 / %x202A-D7FF / %xE000-10FFFF
 * content = SP / HTAB / value-start
 */
const contentRegExp =
  /[\t\x20-\x5B\x5D-\x7E\u{A0}-\u{2027}\u{202A}-\u{D7FF}\u{E000}-\u{10FFFF}]/u;
function parseEntry(sectionId: string[]): CST.Entry {
  const type = 'entry';
  const start = pos;
  const id = parseId();
  checkId(type, sectionId, id);
  const equal = parseChar('=');

  let valueStart = -1;
  let valueEnd = pos;
  let range: CST.Range | null = null;
  const addContent = (line: CST.ValuePart[]) => {
    if (range) {
      const [start, end] = range;
      const value = source.substring(start, end);
      line.push({ type: 'content', value, range });
      if (valueStart < 0) valueStart = start;
      valueEnd = end;
      range = null;
    }
  };

  const raw: CST.ValuePart[][] = [];
  while (pos < source.length) {
    const ls = pos;
    parseWhitespace();
    if (pos === ls && raw.length > 0) break;
    const line: CST.ValuePart[] = [];
    line: while (pos < source.length) {
      const ch = source[pos];
      switch (ch) {
        case '\n':
        case '\r':
          break line;
        case '\\': {
          addContent(line);
          const esc = parseEscape('value');
          line.push(esc);
          if (valueStart < 0) valueStart = esc.range[0];
          valueEnd = esc.range[1];
          break;
        }
        default: {
          const next = pos + 1;
          if (!contentRegExp.test(ch)) {
            onError([pos, next], 'Invalid entry content character');
          }
          if (range) range[1] = next;
          else range = [pos, next];
          pos = next;
        }
      }
    }
    addContent(line);
    raw.push(line);
    parseLineEnd(type);
  }

  if (valueStart < 0) valueStart = valueEnd;
  const value: CST.Value = {
    raw,
    value: source.substring(valueStart, valueEnd),
    range: [valueStart, valueEnd]
  };
  return { type, id, equal, value, range: [start, pos] };
}

/**
 * id = id-part *([ws] "." [ws] id-part)
 * id-part = 1*(id-char / id-escape)
 * id-char = ALPHA / DIGIT / "-" / "_"
 *         / %x00A1-1FFF / %x200C-200D / %x2030-205E / %x2070-2FEF
 *         / %x3001-D7FF / %xF900-FDCF / %xFDF0-FFFD / %x10000-EFFFF
 */
const idCharRegExp =
  /[-a-zA-Z0-9_\u{A1}-\u{1FFF}\u{200C}-\u{200D}\u{2030}-\u{205E}\u{2070}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/u;
function parseId(): CST.Id {
  let start = pos;
  let end = pos;
  const raw: CST.IdPart[] = [];
  const value: string[] = [];

  let curr = '';
  let range: CST.Range | null = null;
  const addContent = (pushCurrent: boolean) => {
    if (range) {
      const src = source.substring(range[0], range[1]);
      raw.push({ type: 'content', value: src, range });
      curr += src;
      range = null;
    }
    if (pushCurrent && curr) {
      value.push(curr);
      curr = '';
    }
  };

  loop: while (pos < source.length) {
    const ch = source[pos];
    switch (ch) {
      case '\n':
      case '\r':
      case '=':
      case ']':
        break loop;
      case '\\': {
        addContent(false);
        const esc = parseEscape('id');
        raw.push(esc);
        curr += parseEscapeValue('id', esc.raw);
        end = pos;
        break;
      }
      case '.': {
        addContent(true);
        const range: CST.Range = [pos, pos + 1];
        const prev = raw.at(-1);
        if (!prev) {
          onError(range, 'Leading dot in identifier');
        } else if (prev.type === 'dot') {
          onError([prev.range[0], pos + 1], 'Repeated dots in identifier');
        }
        raw.push({ type: 'dot', range });
        pos += 1;
        end = pos;
        break;
      }
      case '\t':
      case ' ':
        addContent(true);
        parseWhitespace();
        if (raw.length === 0) start = pos; // trim leading spaces
        break;
      default:
        end = pos + 1;
        if (range) {
          range[1] = end;
        } else {
          range = [pos, end];
          const prev = raw.at(-1);
          if (prev?.type === 'content') {
            onError(
              [prev.range[1], pos],
              'Unexpected whitespace in identifier'
            );
          }
        }
        if (!idCharRegExp.test(ch)) {
          onError([pos, end], 'Invalid identifier character');
        }
        pos = end;
    }
  }
  addContent(true);

  const last = raw.at(-1);
  if (!last) {
    onError([start, Math.max(start + 1, end)], 'Expected an identifier');
  } else if (last.type === 'dot') {
    onError(last.range, 'Trailing dot in identifier');
  }
  return { raw, value, range: [start, Math.max(start, end)] };
}

function checkId(
  context: 'entry' | 'section-head',
  sectionId: string[],
  { value, range }: CST.Id
) {
  const path = sectionId.length ? [...sectionId, ...value] : value;
  let error = false;
  paths: for (const prev of prevIdPaths) {
    const prevLen = prev.path.length;
    const minLen = Math.min(path.length, prevLen);
    for (let i = 0; i < minLen; ++i) {
      if (path[i] !== prev.path[i]) continue paths;
    }
    const msg =
      path.length < prevLen
        ? 'Shorter matching identifier must precede longer one'
        : context === 'entry' && path.length === prevLen
        ? 'Duplicate identifier'
        : '';
    if (msg) {
      if (!prev.error) {
        onError(prev.range, msg);
        prev.error = true;
      }
      onError(range, msg);
      error = true;
      break paths;
    }
  }
  prevIdPaths.push({ path, error, range });
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
const escLength: Record<string, number | undefined> = { x: 2, u: 4, U: 6 };
const escCommonChars = '\\\t nrt';
const escIdRegExp =
  /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E\xA1-\xBF\xD7\xF7\u2010-\u2027\u2030-\u205E\u2190-\u2BFF]/;
const escValueChars = '{|}';
function parseEscape(context: 'id' | 'value'): CST.Escape {
  const start = pos;
  pos += 1; // '\'
  const ch = source[pos];
  pos += 1;
  const hexLength = escLength[ch];
  if (hexLength) {
    parseHexDigits(hexLength);
  } else if (!escCommonChars.includes(ch)) {
    const ok =
      context === 'id' ? escIdRegExp.test(ch) : escValueChars.includes(ch);
    if (!ok) onError([start, pos], 'Unknown character escape');
  }
  const raw = source.substring(start + 1, pos);
  return { type: 'escape', raw, range: [start, pos] };
}

const hexDigits = '0123456789ABCDEFabcdef';
function parseHexDigits(limit: number) {
  let count = 0;
  let ch = source[pos];
  while (count < limit && hexDigits.includes(ch)) {
    count += 1;
    ch = source[pos + count];
  }
  if (count < limit) {
    onError([pos - 2, pos + count], 'Not enough digits in character escape');
  }
  pos += count;
}

function parseEscapeValue(context: 'id' | 'value', raw: string): string {
  const ch = raw[0];
  switch (ch) {
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case 'u':
    case 'U':
    case 'x':
      return String.fromCharCode(parseInt(raw.substring(1), 16));
    case '{':
    case '|':
    case '}':
      return context === 'value' ? '\\' + ch : ch;
    default:
      return ch;
  }
}

/** @returns `-1` on error */
function parseChar(char: string) {
  if (source[pos] === char) {
    pos += 1;
    return pos - 1;
  } else {
    onError([pos, pos + 1], `Expected a ${char} character here`);
    return -1;
  }
}

// newline = CRLF / LF
function parseLineEnd(type: string) {
  let count = 0;
  let ch = source[pos];
  if (ch === '\r') {
    count = 1;
    ch = source[pos + 1];
  }
  if (ch === '\n') {
    pos += count + 1;
  } else if (pos < source.length) {
    let end = source.indexOf('\n', pos);
    if (end === -1) end = source.length;
    const msg =
      type === 'empty-line'
        ? 'Content with unexpected indent'
        : 'Unexpected content at line end';
    onError([pos, end], msg);
  }
}

// ws = 1*(SP / HTAB)
function parseWhitespace() {
  let ch = source[pos];
  while (ch === ' ' || ch === '\t') {
    pos += 1;
    ch = source[pos];
  }
}
