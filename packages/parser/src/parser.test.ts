/* eslint-env jest */

import { parse, ParseOptions, Select } from './parser.js';

function run(shape: Record<string, any>) {
  for (const [src, value] of Object.entries(shape)) {
    const name = src
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    if (typeof value === 'string') {
      test(name, () => {
        expect(parse(src)).toMatchObject([{ type: 'content', value }]);
      });
    } else if (Array.isArray(value)) {
      test(name, () => {
        expect(parse(src)).toMatchObject(
          value.map(v =>
            typeof v === 'string' ? { type: 'content', value: v } : v
          )
        );
      });
    } else if (typeof value === 'object') {
      describe(name, () => run(value));
    }
  }
}

const trimCtx = obj =>
  JSON.parse(
    JSON.stringify(obj, (key, value) => (key === 'ctx' ? undefined : value))
  );

describe('Plain strings', () => {
  run({
    'should accept string only input': {
      'This is a string': 'This is a string',
      '☺☺☺☺': '☺☺☺☺',
      'This is \n a string': 'This is \n a string',
      '中国话不用彁字。': '中国话不用彁字。',
      ' \t leading whitspace': ' \t leading whitspace',
      'trailing whitespace   \n  ': 'trailing whitespace   \n  '
    },

    'should allow you to escape { and } characters': {
      "'{'test": '{test',
      "test'}'": 'test}',
      "'{test}'": '{test}'
    },

    'should gracefully handle quotes (since it ends up in a JS String)': {
      'This is a dbl quote: "': 'This is a dbl quote: "',
      "This is a single quote: '": "This is a single quote: '"
    },

    'should allow you to use extension keywords for plural formats everywhere except where they go':
      {
        'select select, ': 'select select, ',
        'select offset, offset:1 ': 'select offset, offset:1 ',
        'one other, =1 ': 'one other, =1 ',
        'one {select} ': ['one ', { type: 'argument', arg: 'select' }, ' '],
        'one {plural} ': ['one ', { type: 'argument', arg: 'plural' }, ' ']
      },

    'should correctly handle apostrophes': {
      // This mirrors the default DOUBLE_OPTIONAL behavior of ICU.
      "I see '{many}'": 'I see {many}',
      "I said '{''Wow!''}'": "I said {'Wow!'}",
      "I don't know": "I don't know",
      "I don''t know": "I don't know",
      "A'a''a'A": "A'a'a'A",
      "A'{a''a}'A": "A{a'a}A",

      // # and | are not special here.
      "A '#' A": "A '#' A",
      "A '|' A": "A '|' A"
    }
  });
});

describe('Simple arguments', () => {
  run({
    'should accept only a variable': {
      '{test}': [{ type: 'argument', arg: 'test' }],
      '{0}': [{ type: 'argument', arg: '0' }]
    },

    'should not care about white space in a variable': {
      '{test }': [{ type: 'argument', arg: 'test' }],
      '{ test}': [{ type: 'argument', arg: 'test' }],
      '{test  }': [{ type: 'argument', arg: 'test' }],
      '{  \ttest}': [{ type: 'argument', arg: 'test' }],
      '{test}': [{ type: 'argument', arg: 'test' }],
      '{ \n  test  \n\n}': [{ type: 'argument', arg: 'test' }]
    },

    'should maintain exact strings - not affected by variables': {
      'x{test}': ['x', { type: 'argument', arg: 'test' }],
      '\n{test}': ['\n', { type: 'argument', arg: 'test' }],
      ' {test}': [' ', { type: 'argument', arg: 'test' }],
      'x { test}': ['x ', { type: 'argument', arg: 'test' }],
      'x{test} x ': ['x', { type: 'argument', arg: 'test' }, ' x '],
      'x\n{test}\n': ['x\n', { type: 'argument', arg: 'test' }, '\n']
    },

    'should handle extended character literals': {
      '☺{test}': ['☺', { type: 'argument', arg: 'test' }],
      '中{test}中国话不用彁字。': [
        '中',
        { type: 'argument', arg: 'test' },
        '中国话不用彁字。'
      ]
    },

    'should not matter if it has html or something in it': {
      '<div class="test">content: {TEST}</div>': [
        '<div class="test">content: ',
        { type: 'argument', arg: 'TEST' },
        '</div>'
      ]
    }
  });
});

describe('Select', () => {
  describe('should be very whitespace agnostic', () => {
    const exp = [
      {
        type: 'select',
        arg: 'VAR',
        cases: [
          { key: 'key', tokens: [{ type: 'content', value: 'a' }] },
          { key: 'other', tokens: [{ type: 'content', value: 'b' }] }
        ]
      }
    ];

    run({
      '{VAR,select,key{a}other{b}}': exp,
      '{    VAR   ,    select   ,    key      {a}   other    {b}    }': exp,
      '{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }':
        exp,
      '{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }':
        exp
    });
  });

  describe('should allow you to use MessageFormat extension keywords other places, including in select keys', () => {
    const exp = (key: string) => [
      'x ',
      {
        type: 'select',
        arg: 'TEST',
        cases: [
          { key, tokens: [{ type: 'content', value: 'a' }] },
          { key: 'other', tokens: [{ type: 'content', value: 'b' }] }
        ]
      }
    ];

    run({
      'x {TEST, select, select{a} other{b} }': exp('select'),
      'x {TEST, select, offset{a} other{b} }': exp('offset'),
      'x {TEST, select, TEST{a} other{b} }': exp('TEST')
    });
  });

  describe('should be case-sensitive ', () => {
    for (const key of ['Select', 'SELECT', 'selecT']) {
      const src = `{TEST, ${key}, a{a} other{b}}`;
      test(src, () => {
        expect(() => parse(src)).toThrow(`Invalid type identifier: ${key}`);
      });
    }
  });

  describe('numerical keys', () => {
    test('{TEST, select, 0{a} other{b}}', () => {
      expect(() => parse('{TEST, select, 0{a} other{b}}')).not.toThrow();
    });
    test('{TEST, select, =0{a} other{b}}', () => {
      expect(() => parse('{TEST, select, =0{a} other{b}}')).toThrow(
        'The case =0 is not valid with select'
      );
    });
  });
});

describe('Plurals', () => {
  const getPlural = (src: string, opt?: ParseOptions) => {
    const plural = parse(src, opt)[0];
    expect(plural.type).toBe('plural');
    return plural as Select;
  };

  it('should accept a variable, no offset, and plural keys', function () {
    expect(function () {
      parse('{NUM, plural, one{1} other{2}}');
    }).not.toThrow();
  });

  it('should accept exact values with `=` prefixes', function () {
    const plural = getPlural('{NUM, plural, =0{e0} =1{e1} =2{e2} other{2}}');
    expect(plural.cases).toMatchObject([
      { key: '=0' },
      { key: '=1' },
      { key: '=2' },
      { key: 'other' }
    ]);
    expect(() => parse('{NUM, plural, =a{e1} other{2}}')).toThrow(
      /invalid syntax/
    );
  });

  it('should accept the 6 official keywords', () => {
    const plural = getPlural(
      '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
    );
    expect(plural.cases).toMatchObject([
      { key: 'zero' },
      { key: 'one' },
      { key: 'two' },
      { key: 'few' },
      { key: 'many' },
      { key: 'other' }
    ]);
  });

  it('should be gracious with whitespace', function () {
    const exp = trimCtx(parse('{NUM, plural, one{1} other{2}}'));
    expect(exp).toBeInstanceOf(Array);
    for (const src of [
      '{ NUM, plural, one{1} other{2} }',
      '{NUM,plural,one{1}other{2}}',
      '{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}',
      '{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}'
    ])
      expect(parse(src)).toMatchObject(exp);
  });

  describe('Plural offsets', () => {
    it('should accept a valid offset', () => {
      const exp = trimCtx(parse('{NUM, plural, offset:4 other{a}}'));
      expect(exp).toMatchObject([
        {
          type: 'plural',
          arg: 'NUM',
          pluralOffset: 4,
          cases: [{ key: 'other', tokens: [{ type: 'content', value: 'a' }] }]
        }
      ]);
      expect(parse('{NUM,plural,offset:4other{a}}')).toMatchObject(exp);
      expect(parse('{NUM, plural, offset:4 other{a}}')).toMatchObject(exp);
      expect(parse('{NUM,plural,offset:4other{a}}')).toMatchObject(exp);
      expect(
        parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}')
      ).toMatchObject(exp);
    });

    it('should require offset before cases', () => {
      expect(() => parse('{NUM, plural, other{a} offset:4}')).toThrow(
        'Plural offset must be set before cases'
      );
    });
  });

  it('should support quoting', function () {
    expect(
      getPlural("{NUM, plural, one{{x,date,y-M-dd # '#'}} two{two}}").cases[0]
        .tokens
    ).toMatchObject([
      {
        type: 'function',
        arg: 'x',
        key: 'date',
        param: [
          { type: 'content', value: 'y-M-dd ' },
          { type: 'octothorpe' },
          { type: 'content', value: ' #' }
        ]
      }
    ]);
    expect(
      getPlural("{NUM, plural, one{# '' #} two{two}}").cases[0].tokens
    ).toMatchObject([
      { type: 'octothorpe' },
      { type: 'content', value: " ' " },
      { type: 'octothorpe' }
    ]);
    expect(
      getPlural("{NUM, plural, one{# '#'} two{two}}").cases[0].tokens
    ).toMatchObject([{ type: 'octothorpe' }, { type: 'content', value: ' #' }]);
    expect(
      getPlural('{NUM, plural, one{one#} two{two}}').cases[0].tokens
    ).toMatchObject([
      { type: 'content', value: 'one' },
      { type: 'octothorpe' }
    ]);
  });

  it('should handle octothorpes with nested plurals', () => {
    const plural = getPlural('{x, plural, one{{y, plural, other{}}} other{#}}');
    expect(plural.cases[1].tokens[0]).toMatchObject({ type: 'octothorpe' });
  });

  describe('options.strict', function () {
    const src = "{NUM, plural, one{# {VAR,select,key{# '#' one#}}} two{two}}";

    it('should parse # correctly without strict option', function () {
      const select = getPlural(src).cases[0].tokens[2] as Select;
      expect(select.type).toBe('select');
      expect(select.cases[0].tokens).toMatchObject([
        { type: 'octothorpe' },
        { type: 'content', value: ' # one' },
        { type: 'octothorpe' }
      ]);
    });

    it('should parse # correctly with strict option', function () {
      const select = getPlural(src, { strict: true }).cases[0]
        .tokens[2] as Select;
      expect(select.type).toBe('select');
      expect(select.cases[0].tokens).toMatchObject([
        { type: 'content', value: "# '#' one#" }
      ]);
    });
  });
});

describe('Ordinals', () => {
  it('should accept a variable, offset, and keys', () => {
    expect(
      parse('{NUM, selectordinal, offset:1 one{1} other{2}}')
    ).toMatchObject([
      {
        type: 'selectordinal',
        arg: 'NUM',
        pluralOffset: 1,
        cases: [
          { key: 'one', tokens: [{ type: 'content', value: '1' }] },
          { key: 'other', tokens: [{ type: 'content', value: '2' }] }
        ]
      }
    ]);
  });

  it('should accept exact values with `=` prefixes', function () {
    const msg = parse('{NUM, selectordinal, =0{e0} =1{e1} =2{e2} other{2}}');
    expect(msg).toMatchObject([
      {
        type: 'selectordinal',
        cases: [{ key: '=0' }, { key: '=1' }, { key: '=2' }, { key: 'other' }]
      }
    ]);
    expect(() => parse('{NUM, selectordinal, =a{e1} other{2}}')).toThrow(
      /invalid syntax/
    );
  });
});

describe('Functions', function () {
  it('should allow upper-case type, except for built-ins', function () {
    for (const date of ['date', 'Date', '9ate'])
      expect(parse(`{var,${date}}`)).toMatchObject([
        { type: 'function', arg: 'var', key: date }
      ]);
    expect(() => parse('{var,Select}')).toThrow(
      /Invalid type identifier: Select/
    );
  });

  it('should be gracious with whitespace around arg and key', function () {
    const expected = [{ type: 'function', arg: 'var', key: 'date' }];
    expect(parse('{var,date}')).toMatchObject(expected);
    expect(parse('{var, date}')).toMatchObject(expected);
    expect(parse('{ var, date }')).toMatchObject(expected);
    expect(parse('{\nvar,   \ndate\n}')).toMatchObject(expected);
  });

  it('should accept parameters', function () {
    expect(parse('{var,date,long}')[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: [{ type: 'content', value: 'long' }]
    });
    expect(parse('{var,date,long,short}')[0]).toMatchObject({
      param: [{ type: 'content', value: 'long,short' }]
    });
  });

  it('should accept parameters with whitespace', function () {
    expect(parse('{var,date,y-M-d HH:mm:ss zzzz}')[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: [{ type: 'content', value: 'y-M-d HH:mm:ss zzzz' }]
    });
    expect(parse('{var,date,   y-M-d HH:mm:ss zzzz    }')[0]).toMatchObject({
      param: [{ type: 'content', value: '   y-M-d HH:mm:ss zzzz    ' }]
    });
  });

  it('should accept parameters with special characters', function () {
    expect(parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz}")[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: [{ type: 'content', value: "y-M-d {,} ' HH:mm:ss zzzz" }]
    });
    expect(
      parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz'}'}")[0]
    ).toMatchObject({
      param: [{ type: 'content', value: "y-M-d {,} ' HH:mm:ss zzzz}" }]
    });
    expect(parse('{var,date,y-M-d # HH:mm:ss zzzz}')[0]).toMatchObject({
      param: [{ type: 'content', value: 'y-M-d # HH:mm:ss zzzz' }]
    });
    expect(parse("{var,date,y-M-d '#' HH:mm:ss zzzz}")[0]).toMatchObject({
      param: [{ type: 'content', value: "y-M-d '#' HH:mm:ss zzzz" }]
    });
    expect(parse('{var,date,y-M-d, HH:mm:ss zzzz}')[0]).toMatchObject({
      param: [{ type: 'content', value: 'y-M-d, HH:mm:ss zzzz' }]
    });
  });

  it('should accept parameters containing a basic variable', function () {
    expect(parse('{foo, date, {bar}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: [
        { type: 'content', value: ' ' },
        { arg: 'bar', type: 'argument' }
      ]
    });
  });

  it('should accept parameters containing a select', function () {
    expect(parse('{foo, date, {bar, select, other{baz}}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: [
        { type: 'content', value: ' ' },
        {
          arg: 'bar',
          type: 'select',
          cases: [{ key: 'other', tokens: [{ type: 'content', value: 'baz' }] }]
        }
      ]
    });
  });

  it('should accept parameters containing a plural', function () {
    expect(parse('{foo, date, {bar, plural, other{#}}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: [
        { type: 'content', value: ' ' },
        {
          arg: 'bar',
          type: 'plural',
          cases: [{ key: 'other', tokens: [{ type: 'octothorpe' }] }]
        }
      ]
    });
  });

  describe('options.strict', function () {
    it('should require known function key with strict option', function () {
      expect(() => parse('{foo, bar}')).not.toThrow();
      expect(() => parse('{foo, bar}', { strict: true })).toThrow(
        'Invalid strict mode function arg type: bar'
      );
      expect(() => parse('{foo, date}', { strict: true })).not.toThrow();
    });

    it('should parse function parameter as a string', () => {
      expect(
        parse('{foo, date, {foo}{baz, number} # }', { strict: true })
      ).toMatchObject([
        {
          type: 'function',
          arg: 'foo',
          key: 'date',
          param: [
            {
              type: 'content',
              value: '{foo}{baz, number} #',
              ctx: { text: ' {foo}{baz, number} # ' }
            }
          ]
        }
      ]);
    });

    it('should fail informatively for unsupported parse function parameters', () => {
      expect(() =>
        parse('{foo, date, {baz, select, other{fuzz}}}', { strict: true })
      ).toThrow('Unsupported part in strict mode function arg style');
    });
  });
});

describe('Nested blocks', function () {
  it('should allow nested select statements', function () {
    expect(
      parse(
        '{NUM1, select, other{{NUM2, select, one{a} other{{NUM3, select, other{b}}}}}}'
      )
    ).toMatchObject([
      {
        arg: 'NUM1',
        cases: [
          {
            tokens: [
              {
                arg: 'NUM2',
                cases: [
                  { key: 'one', tokens: [{ value: 'a' }] },
                  {
                    key: 'other',
                    tokens: [
                      { arg: 'NUM3', cases: [{ tokens: [{ value: 'b' }] }] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]);
  });

  it('should allow nested plural statements', function () {
    expect(
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 one{#} other{{NUM3, plural, other{b}}}}}}'
      )
    ).toMatchObject([
      {
        arg: 'NUM1',
        cases: [
          {
            tokens: [
              {
                arg: 'NUM2',
                pluralOffset: 1,
                cases: [
                  { key: 'one', tokens: [{ type: 'octothorpe' }] },
                  {
                    key: 'other',
                    tokens: [
                      { arg: 'NUM3', cases: [{ tokens: [{ value: 'b' }] }] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]);
  });
});

describe('Errors', () => {
  describe('Should require matched braces', () => {
    const expectedError = /invalid syntax|Unexpected message end/;
    it('{foo', () => {
      expect(() => parse('{foo')).toThrow(expectedError);
    });
    it('{foo,', () => {
      expect(() => parse('{foo,')).toThrow(expectedError);
    });
    it('{foo, bar', () => {
      expect(() => parse('{foo,bar')).toThrow(expectedError);
    });
    it('{foo, bar,', () => {
      expect(() => parse('{foo,bar,')).toThrow(expectedError);
    });
    it('{foo, date, {bar{}}', () => {
      expect(() => parse('{foo, date, {bar{}}')).toThrow(expectedError);
    });
  });

  it('should not allow an offset for selects', function () {
    expect(function () {
      parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}');
    }).toThrow();
  });

  describe('strictPluralKeys', () => {
    it('should not allow invalid keys for plurals by default', function () {
      expect(function () {
        parse('{NUM, plural, one { 1 } invalid { error } other { 2 }}');
      }).toThrow();
      expect(function () {
        parse('{NUM, plural, one { 1 } some { error } other { 2 }}', {
          cardinal: ['one', 'other']
        });
      }).toThrow();
    });

    it('should allow invalid keys for plurals if the `strictPluralKeys` option is set to false', function () {
      expect(function () {
        parse('{NUM, plural, one { 1 } invalid { error } other { 2 }}', { strictPluralKeys: false });
      }).not.toThrow();
      expect(function () {
        parse('{NUM, plural, one { 1 } some { error } other { 2 }}', {
          cardinal: ['one', 'other'],
          strictPluralKeys: false
        });
      }).not.toThrow();
    });
  });

  it('should not allow invalid keys for selectordinals', function () {
    expect(function () {
      parse('{NUM, selectordinal, one { 1 } invalid { error } other { 2 }}');
    }).toThrow();
    expect(function () {
      parse('{NUM, selectordinal, one { 1 } some { error } other { 2 }}', {
        ordinal: ['one', 'other']
      });
    }).toThrow();
  });

  it('should allow an offset for selectordinals', function () {
    expect(function () {
      parse('{NUM, selectordinal, offset:1 one { 1 } other { 2 }}');
    }).not.toThrow();
  });

  it('should allow characters in variables that are valid ICU identifiers', function () {
    expect(function () {
      parse('{ű\u3000á}');
    }).not.toThrow();
  });

  it('should allow positional variables', function () {
    expect(function () {
      parse('{0}');
    }).not.toThrow();
  });

  it('should throw errors on negative offsets', function () {
    expect(function () {
      parse('{NUM, plural, offset:-4 other{a}}');
    }).toThrow();
  });

  it('should require closing bracket', () => {
    expect(() => parse('{count, plural, one {car} other {cars}')).toThrow();
  });

  it('should complain about unnecessarily quoted #{ outside plural', () => {
    expect(() => parse("foo '#{' bar")).toThrow('Unsupported escape pattern');
  });
});
