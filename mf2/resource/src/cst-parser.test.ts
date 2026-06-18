import { describe, expect, test, vitest } from 'vitest';
import { CST, parseCST } from './cst-parser.ts';

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};
type TestResource = RecursivePartial<CST.Resource>;

function parseOk(source: string) {
  const onError = vitest.fn();
  const res = parseCST(source, onError);
  for (const [range, msg] of onError.mock.calls) {
    console.error(`${msg}: ${source.substring(range[0], range[1])}`);
  }
  expect(onError).not.toHaveBeenCalled();
  return res;
}

function parseFail(source: string) {
  const onError = vitest.fn();
  const res = parseCST(source, onError);
  expect(onError).toHaveBeenCalled();
  return [res, onError.mock.calls] as const;
}

test('empty string', () => {
  const res = parseOk('');
  expect(res).toEqual<TestResource>([{ type: 'empty-line', range: [0, 0] }]);
});

test('single line terminator', () => {
  const res = parseOk('\r\n');
  expect(res).toEqual<TestResource>([{ type: 'empty-line', range: [0, 2] }]);
});

test('comments and empty lines', () => {
  const res = parseOk('\n\n#[foo\\] \n## bar\r\n  \t\n#');
  expect(res).toEqual<TestResource>([
    { type: 'empty-line', range: [0, 1] },
    { type: 'empty-line', range: [1, 2] },
    { type: 'comment', content: '[foo\\] ', range: [2, 11] },
    { type: 'comment', content: '# bar', range: [11, 19] },
    { type: 'empty-line', range: [19, 23] },
    { type: 'comment', content: '', range: [23, 24] }
  ]);
});

test('frontmatter', () => {
  const res = parseOk('@locale en-ZZ\n---\n');
  expect(res).toEqual<TestResource>([
    {
      type: 'metadata',
      key: {
        range: [1, 7],
        raw: [{ range: [1, 7], type: 'content', value: 'locale' }],
        value: 'locale'
      },
      range: [0, 14],
      value: {
        range: [8, 13],
        raw: [[{ range: [8, 13], type: 'content', value: 'en-ZZ' }]],
        value: 'en-ZZ'
      }
    },
    { range: [14, 18], type: 'frontmatter' }
  ]);
});

test('one-line entry', () => {
  const res = parseOk('foo = {bar}');
  expect(res).toEqual<TestResource>([
    {
      type: 'entry',
      id: {
        raw: [{ type: 'content', value: 'foo', range: [0, 3] }],
        value: ['foo'],
        range: [0, 3]
      },
      equal: 4,
      value: {
        raw: [[{ type: 'content', value: '{bar}', range: [6, 11] }]],
        value: '{bar}',
        range: [6, 11]
      },
      range: [0, 11]
    }
  ]);
});

test('multi-line entry', () => {
  const res = parseOk('foo = \n  {\n    bar\n  }\nnext={value}');
  expect(res).toEqual<TestResource>([
    {
      type: 'entry',
      id: {
        raw: [{ type: 'content', value: 'foo', range: [0, 3] }],
        value: ['foo'],
        range: [0, 3]
      },
      equal: 4,
      value: {
        raw: [
          [],
          [{ type: 'content', value: '{', range: [9, 10] }],
          [{ type: 'content', value: 'bar', range: [15, 18] }],
          [{ type: 'content', value: '}', range: [21, 22] }]
        ],
        value: '{\n    bar\n  }',
        range: [9, 22]
      },
      range: [0, 23]
    },
    {
      type: 'entry',
      id: {
        raw: [{ type: 'content', value: 'next', range: [23, 27] }],
        value: ['next'],
        range: [23, 27]
      },
      equal: 27,
      value: {
        raw: [[{ type: 'content', value: '{value}', range: [28, 35] }]],
        value: '{value}',
        range: [28, 35]
      },
      range: [23, 35]
    }
  ]);
});

test('multi-line entry with CRLF terminators', () => {
  const res = parseOk('foo = \r\n  {\r\n    bar\r\n  }\r\n');
  expect(res).toEqual<TestResource>([
    {
      type: 'entry',
      id: {
        raw: [{ type: 'content', value: 'foo', range: [0, 3] }],
        value: ['foo'],
        range: [0, 3]
      },
      equal: 4,
      value: {
        raw: [
          [],
          [{ type: 'content', value: '{', range: [10, 11] }],
          [{ type: 'content', value: 'bar', range: [17, 20] }],
          [{ type: 'content', value: '}', range: [24, 25] }]
        ],
        value: '{\r\n    bar\r\n  }',
        range: [10, 25]
      },
      range: [0, 27]
    }
  ]);
});

test('section-head with trailing whitespace', () => {
  const res = parseOk('[ foo . bar ] \t\n');
  expect(res).toEqual<TestResource>([
    {
      type: 'section-head',
      id: {
        raw: [
          { type: 'content', value: 'foo', range: [2, 5] },
          { type: 'dot', range: [6, 7] },
          { type: 'content', value: 'bar', range: [8, 11] }
        ],
        value: ['foo', 'bar'],
        range: [2, 11]
      },
      close: 12,
      range: [0, 16]
    }
  ]);
});

test('escaped contents', () => {
  const res = parseOk(
    '[f\\xf6o\\r\\n\\ \t.b\\u00E4r\\]\\|\\{]\nlong\\tkey={\\{msg\\|\\nlines}\n'
  );
  expect(res).toMatchObject<TestResource>([
    {
      type: 'section-head',
      id: {
        raw: [
          { type: 'content', value: 'f' },
          { type: 'escape', raw: 'xf6' },
          { type: 'content', value: 'o' },
          { type: 'escape', raw: 'r' },
          { type: 'escape', raw: 'n' },
          { type: 'escape', raw: ' ' },
          { type: 'dot' },
          { type: 'content', value: 'b' },
          { type: 'escape', raw: 'u00E4' },
          { type: 'content', value: 'r' },
          { type: 'escape', raw: ']' },
          { type: 'escape', raw: '|' },
          { type: 'escape', raw: '{' }
        ],
        value: ['föo\r\n ', 'bär]|{']
      }
    },
    {
      type: 'entry',
      id: {
        raw: [
          { type: 'content', value: 'long' },
          { type: 'escape', raw: 't' },
          { type: 'content', value: 'key' }
        ],
        value: ['long\tkey']
      },
      value: {
        raw: [
          [
            { type: 'content', value: '{' },
            { type: 'escape', raw: '{' },
            { type: 'content', value: 'msg' },
            { type: 'escape', raw: '|' },
            { type: 'escape', raw: 'n' },
            { type: 'content', value: 'lines}' }
          ]
        ],
        value: '{\\{msg\\|\\nlines}'
      }
    }
  ]);
});

describe('duplicate identifiers', () => {
  test('top-level entries', () => {
    const [res, calls] = parseFail('a=1\na=2\na=3');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'entry',
        id: { value: ['a'], range: [0, 1] },
        value: { raw: [[{ type: 'content', value: '1' }]] }
      },
      {
        type: 'entry',
        id: { value: ['a'], range: [4, 5] },
        value: { raw: [[{ type: 'content', value: '2' }]] }
      },
      {
        type: 'entry',
        id: { value: ['a'], range: [8, 9] },
        value: { raw: [[{ type: 'content', value: '3' }]] }
      }
    ]);
    expect(calls).toEqual([
      [(res[0] as CST.Entry).id.range, 'Duplicate identifier'],
      [(res[1] as CST.Entry).id.range, 'Duplicate identifier'],
      [(res[2] as CST.Entry).id.range, 'Duplicate identifier']
    ]);
  });

  test('identifiers get longer', () => {
    const res = parseOk('a=1\na.b=2\n[a.b]\nc=3');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'entry',
        id: { value: ['a'] },
        value: { raw: [[{ type: 'content', value: '1' }]] }
      },
      {
        type: 'entry',
        id: { value: ['a', 'b'] },
        value: { raw: [[{ type: 'content', value: '2' }]] }
      },
      { type: 'section-head', id: { value: ['a', 'b'] } },
      {
        type: 'entry',
        id: { value: ['c'] },
        value: { raw: [[{ type: 'content', value: '3' }]] }
      }
    ]);
  });

  test('identifiers get shorter', () => {
    const [res, calls] = parseFail('a.b.c=1\na.b=2\na=3\n[a.b]');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'entry',
        id: { value: ['a', 'b', 'c'] },
        value: { raw: [[{ type: 'content', value: '1' }]] }
      },
      {
        type: 'entry',
        id: { value: ['a', 'b'] },
        value: { raw: [[{ type: 'content', value: '2' }]] }
      },
      {
        type: 'entry',
        id: { value: ['a'] },
        value: { raw: [[{ type: 'content', value: '3' }]] }
      },
      { type: 'section-head', id: { value: ['a', 'b'] } }
    ]);
    expect(calls).toEqual([
      [
        (res[0] as CST.Entry).id.range,
        'Shorter matching identifier must precede longer one'
      ],
      [
        (res[1] as CST.Entry).id.range,
        'Shorter matching identifier must precede longer one'
      ],
      [
        (res[2] as CST.Entry).id.range,
        'Shorter matching identifier must precede longer one'
      ]
    ]);
  });
});

describe('errors', () => {
  test('invalid content', () => {
    const [res, calls] = parseFail('\vkey=foo\u2028bar');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'entry',
        id: { raw: [{ type: 'content', value: '\vkey' }], value: ['\vkey'] },
        value: { raw: [[{ type: 'content', value: 'foo\u2028bar' }]] }
      }
    ]);
    expect(calls).toEqual([
      [[0, 1], 'Invalid identifier character'],
      [[8, 9], 'Invalid entry content character']
    ]);
  });

  test('empty identifier', () => {
    const [res, calls] = parseFail('[ ]');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'section-head',
        id: { raw: [], value: [], range: [2, 3] }
      }
    ]);
    expect(calls).toEqual([[[2, 3], 'Expected an identifier']]);
  });

  test('metadata without key', () => {
    const [res, calls] = parseFail('@ x');
    expect(res).toEqual<TestResource>([
      {
        type: 'metadata',
        key: { range: [1, 2], raw: [], value: '' },
        value: {
          raw: [[{ range: [2, 3], type: 'content', value: 'x' }]],
          value: 'x',
          range: [2, 3]
        },
        range: [0, 3]
      }
    ]);
    expect(calls).toEqual([[[1, 2], 'Expected a metadata key']]);
  });

  test('metadata with no whitespace between key & value', () => {
    const [res, calls] = parseFail('@x.foo');
    expect(res).toEqual<TestResource>([
      {
        type: 'metadata',
        key: {
          raw: [{ range: [1, 2], type: 'content', value: 'x' }],
          value: 'x',
          range: [1, 2]
        },
        value: { range: [2, 2], raw: [], value: '' },
        range: [0, 2]
      },
      {
        type: 'entry',
        id: {
          range: [2, 6],
          raw: [
            { range: [2, 3], type: 'dot' },
            { range: [3, 6], type: 'content', value: 'foo' }
          ],
          value: ['foo']
        },
        equal: -1,
        value: { range: [6, 6], raw: [], value: '' },
        range: [2, 6]
      }
    ]);
    expect(calls).toEqual([
      [[2, 6], 'Unexpected content at line end'],
      [[2, 3], 'Leading dot in identifier'],
      [[6, 7], 'Expected a = character here']
    ]);
  });

  test('identifier dots', () => {
    const [res, calls] = parseFail('[..]');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'section-head',
        id: {
          raw: [
            { type: 'dot', range: [1, 2] },
            { type: 'dot', range: [2, 3] }
          ],
          value: []
        }
      }
    ]);
    expect(calls).toEqual([
      [[1, 2], 'Leading dot in identifier'],
      [[1, 3], 'Repeated dots in identifier'],
      [[2, 3], 'Trailing dot in identifier']
    ]);
  });

  test('identifier spaces', () => {
    const [res, calls] = parseFail('[a b]');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'section-head',
        id: {
          raw: [
            { type: 'content', value: 'a', range: [1, 2] },
            { type: 'content', value: 'b', range: [3, 4] }
          ],
          value: ['a', 'b']
        }
      }
    ]);
    expect(calls).toEqual([[[2, 3], 'Unexpected whitespace in identifier']]);
  });

  test('character escapes', () => {
    const [res, calls] = parseFail('\\\n\\!\\a=\\!\\x1\\u123\\U12345');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'entry',
        id: {
          raw: [
            { type: 'escape', raw: '\n', range: [0, 2] },
            { type: 'escape', raw: '!', range: [2, 4] }, // valid in id
            { type: 'escape', raw: 'a', range: [4, 6] }
          ],
          value: ['\n!a']
        },
        value: {
          raw: [
            [
              { type: 'escape', raw: '!', range: [7, 9] },
              { type: 'escape', raw: 'x1', range: [9, 12] },
              { type: 'escape', raw: 'u123', range: [12, 17] },
              { type: 'escape', raw: 'U12345', range: [17, 24] }
            ]
          ]
        }
      }
    ]);
    expect(calls).toEqual([
      [[0, 2], 'Unknown character escape'],
      [[4, 6], 'Unknown character escape'],
      [[7, 9], 'Unknown character escape'],
      [[9, 12], 'Not enough digits in character escape'],
      [[12, 17], 'Not enough digits in character escape'],
      [[17, 24], 'Not enough digits in character escape']
    ]);
  });

  test('missing characters', () => {
    const [res, calls] = parseFail('[a\nb c ] d');
    expect(res).toMatchObject<TestResource>([
      {
        type: 'section-head',
        id: {
          raw: [{ type: 'content', value: 'a', range: [1, 2] }],
          value: ['a']
        },
        close: -1
      },
      {
        type: 'entry',
        id: {
          raw: [
            { type: 'content', value: 'b', range: [3, 4] },
            { type: 'content', value: 'c', range: [5, 6] }
          ],
          value: ['b', 'c']
        },
        equal: -1,
        value: { raw: [[{ type: 'content', value: '] d', range: [7, 10] }]] }
      }
    ]);
    expect(calls).toEqual([
      [[2, 3], 'Expected a ] character here'],
      [[4, 5], 'Unexpected whitespace in identifier'],
      [[7, 8], 'Expected a = character here']
    ]);
  });

  test('trailing content', () => {
    const [res, calls] = parseFail(' \t#c\n[a] #d');
    expect(res).toMatchObject<TestResource>([
      { type: 'empty-line', range: [0, 2] },
      { type: 'comment', content: 'c', range: [2, 5] },
      {
        type: 'section-head',
        id: {
          raw: [{ type: 'content', value: 'a', range: [6, 7] }],
          value: ['a']
        },
        close: 7,
        range: [5, 9]
      },
      { type: 'comment', content: 'd', range: [9, 11] }
    ]);
    expect(calls).toEqual([
      [[2, 4], 'Content with unexpected indent'],
      [[9, 11], 'Unexpected content at line end']
    ]);
  });
});
