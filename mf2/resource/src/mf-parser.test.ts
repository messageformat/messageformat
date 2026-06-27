import type { ExpectationResult } from '@vitest/expect';
import { MessageFormat, MessagePart } from 'messageformat';
import { describe, expect, test } from 'vitest';
import {
  MessageResourceParseError,
  parseMessageResource
} from './mf-parser.ts';
import { parseCST } from './cst-parser.ts';
import { buildMessageResourceFromCST } from './mf-from-cst.ts';

declare module 'vitest' {
  interface Matchers {
    messageFormatsAs: (
      expected:
        | string
        | MessagePart<string>[]
        | {
            params?: Record<string, unknown>;
            formatted?: string;
            parts?: MessagePart<string>[];
          }
    ) => ExpectationResult;
  }
}

expect.extend({
  messageFormatsAs(mf, expected) {
    if (mf instanceof MessageFormat) {
      let params: Record<string, unknown> | undefined;
      let formatted: string | undefined;
      let parts: MessagePart<string>[] | undefined;
      if (typeof expected === 'string') {
        formatted = expected;
      } else if (Array.isArray(expected)) {
        parts = expected;
      } else if (expected) {
        ({ params, formatted, parts } = expected);
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
    return {
      pass: false,
      message: () => `expected ${mf} to be a MessageFormat`,
      actual: mf
    };
  }
});

const FSI = '\u2068';
const PDI = '\u2069';

for (const { name, parse } of [
  { name: 'parseMessageResource', parse: parseMessageResource },
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
      expect(res).toEqual({ locale: 'und', messages: {} });
    });

    test('minimal non-empty resource', () => {
      const res = parse('@locale und\n---\nkey = value');
      expect(res).toEqual({
        locale: 'und',
        messages: {
          key: {
            value: expect.messageFormatsAs({
              formatted: 'value',
              parts: [{ type: 'text', value: 'value' }]
            })
          }
        }
      });
    });

    test('comments and empty lines', () => {
      const res = parse(
        '\n\n#[foo\\] \n## bar\r\n  \t\n#\n@locale und\n---\n\n\n#[foo\\] \n## bar\r\n  \t\n#\n'
      );
      expect(res).toEqual({ locale: 'und', messages: {} });
    });

    test('frontmatter', () => {
      const res = parse(
        '@locale en-ZZ\n@foo value\n  on multiple\n\n\n lines\n---\n'
      );
      expect(res).toEqual({ locale: 'en-ZZ', messages: {} });
    });

    test('one-line entry', () => {
      const res = parse('@locale und\n---\nfoo = {bar}');
      expect(res).toEqual({
        locale: 'und',
        messages: {
          foo: {
            value: expect.messageFormatsAs([
              { type: 'bidiIsolation', value: FSI },
              { locale: 'und', type: 'string', value: 'bar' },
              { type: 'bidiIsolation', value: PDI }
            ])
          }
        }
      });
    });

    test('multi-line entry', () => {
      const res = parse(
        '@locale und\n---\nfoo = \n  {\n    bar\n  }\nnext=value'
      );
      expect(res).toEqual({
        locale: 'und',
        messages: {
          foo: {
            value: expect.messageFormatsAs([
              { type: 'bidiIsolation', value: FSI },
              { locale: 'und', type: 'string', value: 'bar' },
              { type: 'bidiIsolation', value: PDI }
            ])
          },
          next: {
            value: expect.messageFormatsAs([{ type: 'text', value: 'value' }])
          }
        }
      });
    });

    test('multi-line entry with empty lines', () => {
      const res = parse(
        '@locale und\n---\nfoo = \n\n  {\n\n    bar\n  }\n\nnext=value'
      );
      expect(res).toEqual({
        locale: 'und',
        messages: {
          foo: {
            value: expect.messageFormatsAs([
              { type: 'bidiIsolation', value: FSI },
              { locale: 'und', type: 'string', value: 'bar' },
              { type: 'bidiIsolation', value: PDI }
            ])
          },
          next: {
            value: expect.messageFormatsAs([{ type: 'text', value: 'value' }])
          }
        }
      });
    });

    test('multi-line entry with CRLF terminators', () => {
      const res = parse(
        '@locale und\r\n---\r\nfoo = \r\n  {\r\n    bar\r\n  }\r\nnext=value'
      );
      expect(res).toEqual({
        locale: 'und',
        messages: {
          foo: {
            value: expect.messageFormatsAs([
              { type: 'bidiIsolation', value: FSI },
              { locale: 'und', type: 'string', value: 'bar' },
              { type: 'bidiIsolation', value: PDI }
            ])
          },
          next: {
            value: expect.messageFormatsAs([{ type: 'text', value: 'value' }])
          }
        }
      });
    });

    test('section-head with trailing whitespace', () => {
      const res = parse('@locale und\n---\n[ foo . bar ] \t\n');
      expect(res).toEqual({
        locale: 'und',
        messages: { foo: { messages: { bar: { messages: {} } } } }
      });
    });

    test('escaped contents', () => {
      const res = parse(
        '@locale und\n---\n[f\\xf6o\\r\\n\\ \t.b\\u00E4r\\]\\|\\{]\nlong\\tkey=\\{msg\\|\\nlines\\}\n'
      );
      expect(res).toEqual({
        locale: 'und',
        messages: {
          'föo\r\n ': {
            messages: {
              'bär]|{': {
                messages: {
                  'long\tkey': {
                    value: expect.messageFormatsAs('{msg|\nlines}')
                  }
                }
              }
            }
          }
        }
      });
    });

    describe('duplicate identifiers', () => {
      test('top-level entries', () => {
        expect(() => parse('@locale und\n---\na=1\na=2\n')).toThrow(
          'Message already defined'
        );
      });

      test('identifiers get longer', () => {
        const res = parse('@locale und\n---\na=1\na.b=2\n[a.b]\nc=3');
        expect(res).toEqual({
          locale: 'und',
          messages: {
            a: {
              value: expect.messageFormatsAs('1'),
              messages: {
                b: {
                  value: expect.messageFormatsAs('2'),
                  messages: { c: { value: expect.messageFormatsAs('3') } }
                }
              }
            }
          }
        });
      });

      test.skip('identifiers get shorter', () => {
        const res = parse('@locale und\n---\na.b.c=1\na.b=2\na=3\n[a.b]');
        expect(res).toEqual({
          locale: 'und',
          messages: {
            a: {
              value: expect.messageFormatsAs('3'),
              messages: {
                b: {
                  value: expect.messageFormatsAs('2'),
                  messages: { c: { value: expect.messageFormatsAs('1') } }
                }
              }
            }
          }
        });
      });
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
