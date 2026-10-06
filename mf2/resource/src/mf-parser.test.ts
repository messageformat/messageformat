import type { ExpectationResult } from '@vitest/expect';
import {
  MessageFormat,
  type MessageFormatOptions,
  type MessagePart,
  type Model
} from 'messageformat';
import { describe, expect, test } from 'vitest';
import { parseCST } from './cst-parser.ts';
import { buildMessageResourceFromCST } from './mf-from-cst.ts';
import {
  MessageResource,
  MessageResourceParseError,
  MessageWrapper,
  parseMessageResource
} from './mf-parser.ts';
import { compileMessageResource } from './mf-compile.ts';

declare module 'vitest' {
  interface Matchers {
    messageFormatsAs: (
      expected:
        | string
        | MessagePart<string>[]
        | {
            locale?: string;
            options?: MessageFormatOptions;
            params?: Record<string, unknown>;
            formatted?: string;
            parts?: MessagePart<string>[];
          }
    ) => ExpectationResult;
  }
}

expect.extend({
  messageFormatsAs(msg, expected) {
    let locale = 'en-US';
    let options: MessageFormatOptions | undefined;
    let params: Record<string, unknown> | undefined;
    let formatted: string | undefined;
    let parts: MessagePart<string>[] | undefined;
    if (typeof expected === 'string') {
      formatted = expected;
    } else if (Array.isArray(expected)) {
      parts = expected;
    } else if (expected) {
      ({ options, params, formatted, parts } = expected);
      if (expected.locale) locale = expected.locale;
    }

    let mf;
    try {
      mf =
        msg instanceof MessageFormat
          ? msg
          : new MessageFormat(locale, msg, options);
    } catch (error) {
      return { pass: false, message: () => String(error), actual: msg };
    }

    if (typeof formatted === 'string') {
      const res = mf.format(params);
      expect(res).toEqual(formatted);
    }

    if (parts) {
      const res = mf.formatToParts(params);
      expect(res).toEqual(parts);
    }

    return { pass: true, message: () => 'ok' };
  }
});

const FSI = '\u2068';
const PDI = '\u2069';

for (const { name, parse } of [
  { name: 'parseMessageResource', parse: parseMessageResource },
  {
    name: 'compileMessageResource',
    parse(src: string) {
      const res = parseMessageResource(src);
      return compileMessageResource(res);
    }
  },
  {
    name: 'buildMessageResourceFromCST',
    parse(src: string) {
      const cst = parseCST(src, (range, msg) => {
        throw new MessageResourceParseError(range[0], msg);
      });
      return buildMessageResourceFromCST(cst);
    }
  }
]) {
  describe(name, () => {
    test('empty string', () => {
      expect(() => parse('')).toThrow('Missing resource frontmatter');
    });

    test('missing locale', () => {
      expect(() => parse('---')).toThrow(
        'No locale metadata in resource frontmatter'
      );
    });

    test('minimal empty resource', () => {
      const res = parse('@locale und\n---\n');
      if (res instanceof MessageResource) expect(res.locale).toBe('und');
      expect(res.size).toBe(0);
    });

    test('minimal non-empty resource', () => {
      const res = parse('@locale und\n---\nkey = value');
      expect(res.size).toBe(1);
      expect(res.get('key')!.value).messageFormatsAs({
        formatted: 'value',
        parts: [{ type: 'text', value: 'value' }]
      });
    });

    test('comments and empty lines', () => {
      const res = parse(
        '\n\n#[foo\\] \n## bar\r\n  \t\n#\n@locale und\n---\n\n\n#[foo\\] \n## bar\r\n  \t\n#\n'
      );
      if (res instanceof MessageResource) expect(res.locale).toBe('und');
      expect(res.size).toBe(0);
    });

    test('frontmatter', () => {
      const res = parse(
        '@locale en-ZZ\n@foo value\n  on multiple\n\n\n lines\n---\n'
      );
      if (res instanceof MessageResource) expect(res.locale).toBe('en-ZZ');
      expect(res.size).toBe(0);
    });

    test('one-line entry', () => {
      const res = parse('@locale und\n---\nfoo = {bar}');
      expect(res.size).toBe(1);
      expect(res.get('foo')!.value).messageFormatsAs({
        locale: 'und',
        parts: [
          { type: 'bidiIsolation', value: FSI },
          { locale: 'und', type: 'string', value: 'bar' },
          { type: 'bidiIsolation', value: PDI }
        ]
      });
    });

    test('multi-line entry', () => {
      const res = parse(
        '@locale und\n---\nfoo = \n  {\n    bar\n  }\nnext=value'
      );
      expect(res.size).toBe(2);
      expect(res.get('foo')!.value).messageFormatsAs({
        locale: 'und',
        parts: [
          { type: 'bidiIsolation', value: FSI },
          { locale: 'und', type: 'string', value: 'bar' },
          { type: 'bidiIsolation', value: PDI }
        ]
      });
      expect(res.get('next')!.value).messageFormatsAs([
        { type: 'text', value: 'value' }
      ]);
    });

    test('multi-line entry with empty lines', () => {
      const res = parse(
        '@locale und\n---\nfoo = \n\n  {\n\n    bar\n  }\n\nnext=value'
      );
      expect(res.size).toBe(2);
      expect(res.get('foo')!.value).messageFormatsAs({
        locale: 'und',
        parts: [
          { type: 'bidiIsolation', value: FSI },
          { locale: 'und', type: 'string', value: 'bar' },
          { type: 'bidiIsolation', value: PDI }
        ]
      });
      expect(res.get('next')!.value).messageFormatsAs([
        { type: 'text', value: 'value' }
      ]);
    });

    test('multi-line entry with CRLF terminators', () => {
      const res = parse(
        '@locale und\r\n---\r\nfoo = \r\n  {\r\n    bar\r\n  }\r\nnext=value'
      );
      expect(res.size).toBe(2);
      expect(res.get('foo')!.value).messageFormatsAs({
        locale: 'und',
        parts: [
          { type: 'bidiIsolation', value: FSI },
          { locale: 'und', type: 'string', value: 'bar' },
          { type: 'bidiIsolation', value: PDI }
        ]
      });
      expect(res.get('next')!.value).messageFormatsAs([
        { type: 'text', value: 'value' }
      ]);
    });

    test('section-head with trailing whitespace', () => {
      const res = parse('@locale und\n---\n[ foo . bar ] \t\n');
      expect(res.get('foo')!.get('bar')!.size).toBe(0);
    });

    test('escaped contents', () => {
      const res = parse(
        '@locale und\n---\n[f\\xf6o\\r\\n\\ \t.b\\u00E4r\\]\\|\\{]\nlong\\tkey=\\{msg\\|\\nlines\\}\n'
      );
      expect(res.size).toBe(1);
      expect(
        res.get('föo\r\n ')!.get('bär]|{')!.get('long\tkey')!.value
      ).messageFormatsAs('{msg|\nlines}');
    });

    describe.runIf(
      name === 'parseMessageResource' || name === 'buildMessageResourceFromCST'
    )('duplicate identifiers', () => {
      const patternMessage = (pattern: string[]): Model.PatternMessage => ({
        type: 'message',
        declarations: [],
        pattern
      });

      test('top-level entries', () => {
        expect(() => parse('@locale und\n---\na=1\na=2\n')).toThrow(
          'Message already defined'
        );
      });

      test('identifiers get longer', () => {
        const res = parse('@locale und\n---\na=1\na.b=2\n[a.b]\nc=3');
        const c = new MessageWrapper(patternMessage(['3']));
        const b = new MessageWrapper(patternMessage(['2']), [['c', c]]);
        const a = new MessageWrapper(patternMessage(['1']), [['b', b]]);
        expect(res).toEqual(new MessageResource('und', [['a', a]]));
      });

      test.runIf(name === 'parseMessageResource')(
        'identifiers get shorter',
        () => {
          const res = parse('@locale und\n---\na.b.c=1\na.b=2\na=3\n[a.b]');
          const c = new MessageWrapper(patternMessage(['1']));
          const b = new MessageWrapper(patternMessage(['2']), [['c', c]]);
          const a = new MessageWrapper(patternMessage(['3']), [['b', b]]);
          expect(res).toEqual(new MessageResource('und', [['a', a]]));
        }
      );
    });

    describe('errors', () => {
      for (const [body, error] of [
        ['\vkey = foo', 'Invalid entry identifier'],
        ['[ ]', 'Invalid section identifier'],
        ['[..]', 'Invalid section identifier'],
        ['[a b]', 'Invalid section identifier'],
        ['[a.b] c', 'Invalid section identifier'],
        ['[a.b] #c', 'Invalid section identifier'],
        ['key foo', 'Invalid entry identifier'],
        ['key = foo\u2028bar', 'Invalid entry value'],
        ['\t# c', 'Invalid indent'],
        ['a.b = 1\nc = 2\n[a]\nb = 3', 'Message already defined'],
        ['a = 1\n---b = 2', 'Invalid frontmatter separator'],
        ['a = 1\n[---b]', 'Invalid frontmatter separator']
      ]) {
        test(JSON.stringify(body), () => {
          expect(() => parse(`@locale und\n---\n${body}`)).toThrow(error);
        });
      }
    });
  });
}
