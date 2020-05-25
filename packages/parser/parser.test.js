/* eslint-env jest */

const fs = require('fs');
const { resolve } = require('path');
const peg = require('pegjs');

let parse = null;
beforeAll(() => {
  const src = fs.readFileSync(resolve(__dirname, 'parser.pegjs'), 'utf8');
  expect(src).not.toBeFalsy();
  const parser = peg.generate(src);
  expect(parser.parse).toBeInstanceOf(Function);
  parse = parser.parse;
});

describe('Replacement', function () {
  it('should accept string only input', function () {
    expect(parse('This is a string')[0]).toBe('This is a string');
    expect(parse('☺☺☺☺')[0]).toBe('☺☺☺☺');
    expect(parse('This is \n a string')[0]).toBe('This is \n a string');
    expect(parse('中国话不用彁字。')[0]).toBe('中国话不用彁字。');
    expect(parse(' \t leading whitspace')[0]).toBe(' \t leading whitspace');
    expect(parse('trailing whitespace   \n  ')[0]).toBe(
      'trailing whitespace   \n  '
    );
  });

  it('should allow you to escape { and } characters', function () {
    expect(parse("'{'test")[0]).toBe('{test');
    expect(parse("test'}'")[0]).toBe('test}');
    expect(parse("'{test}'")[0]).toBe('{test}');
  });

  it('should gracefully handle quotes (since it ends up in a JS String)', function () {
    expect(parse('This is a dbl quote: "')[0]).toBe('This is a dbl quote: "');
    expect(parse("This is a single quote: '")[0]).toBe(
      "This is a single quote: '"
    );
  });

  it('should accept only a variable', function () {
    expect(parse('{test}')).toBeInstanceOf(Array);
    expect(parse('{0}')).toBeInstanceOf(Array);
  });

  it('should not care about white space in a variable', function () {
    var targetStr = JSON.stringify(parse('{test}'));
    expect(JSON.stringify(parse('{test }'))).toBe(targetStr);
    expect(JSON.stringify(parse('{ test}'))).toBe(targetStr);
    expect(JSON.stringify(parse('{test  }'))).toBe(targetStr);
    expect(JSON.stringify(parse('{  test}'))).toBe(targetStr);
    expect(JSON.stringify(parse('{test}'))).toBe(targetStr);
  });

  it('should maintain exact strings - not affected by variables', function () {
    expect(parse('x{test}')[0]).toBe('x');
    expect(parse('\n{test}')[0]).toBe('\n');
    expect(parse(' {test}')[0]).toBe(' ');
    expect(parse('x { test}')[0]).toBe('x ');
    expect(parse('x{test} x ')[2]).toBe(' x ');
    expect(parse('x\n{test}\n')[0]).toBe('x\n');
    expect(parse('x\n{test}\n')[2]).toBe('\n');
  });

  it('should handle extended character literals', function () {
    expect(parse('☺{test}')[0]).toBe('☺');
    expect(parse('中{test}中国话不用彁字。')[2]).toBe('中国话不用彁字。');
  });

  it("shouldn't matter if it has html or something in it", function () {
    expect(parse('<div class="test">content: {TEST}</div>')[0]).toBe(
      '<div class="test">content: '
    );
    expect(parse('<div class="test">content: {TEST}</div>')[1].arg).toBe(
      'TEST'
    );
    expect(parse('<div class="test">content: {TEST}</div>')[2]).toBe('</div>');
  });

  it('should allow you to use extension keywords for plural formats everywhere except where they go', function () {
    expect(parse('select select, ')[0]).toBe('select select, ');
    expect(parse('select offset, offset:1 ')[0]).toBe(
      'select offset, offset:1 '
    );
    expect(parse('one other, =1 ')[0]).toBe('one other, =1 ');
    expect(parse('one {select} ')[1].arg).toBe('select');
    expect(parse('one {plural} ')[1].arg).toBe('plural');
  });

  it('should correctly handle apostrophes', function () {
    // This mirrors the default DOUBLE_OPTIONAL behavior of ICU.
    expect(parse("I see '{many}'")[0]).toBe('I see {many}');
    expect(parse("I said '{''Wow!''}'")[0]).toBe("I said {'Wow!'}");
    expect(parse("I don't know")[0]).toBe("I don't know");
    expect(parse("I don''t know")[0]).toBe("I don't know");
    expect(parse("A'a''a'A")[0]).toBe("A'a'a'A");
    expect(parse("A'{a''a}'A")[0]).toBe("A{a'a}A");

    // # and | are not special here.
    expect(parse("A '#' A")[0]).toBe("A '#' A");
    expect(parse("A '|' A")[0]).toBe("A '|' A");
  });
});
describe('Simple arguments', function () {
  it('should accept a statement based on a variable', function () {
    expect(function () {
      parse('{VAR}');
    }).not.toThrow();
  });

  it('should be very whitespace agnostic', function () {
    var res = JSON.stringify(parse('{VAR}'));
    expect(JSON.stringify(parse('{VAR}'))).toBe(res);
    expect(JSON.stringify(parse('{    VAR   }'))).toBe(res);
    expect(JSON.stringify(parse('{ \n   VAR  \n}'))).toBe(res);
    expect(JSON.stringify(parse('{ \t  VAR  \n }'))).toBe(res);
  });

  it('should be correctly parsed', function () {
    expect(parse('{VAR}')[0].type).toBe('argument');
    expect(parse('{VAR}')[0].arg).toBe('VAR');
  });
});
describe('Selects', function () {
  it('should accept a select statement based on a variable', function () {
    expect(function () {
      parse('{VAR, select, key{a} other{b}}');
    }).not.toThrow();
  });

  it('should be very whitespace agnostic', function () {
    var firstRes = JSON.stringify(parse('{VAR, select, key{a} other{b}}'));
    expect(JSON.stringify(parse('{VAR,select,key{a}other{b}}'))).toBe(firstRes);
    expect(
      JSON.stringify(
        parse('{    VAR   ,    select   ,    key      {a}   other    {b}    }')
      )
    ).toBe(firstRes);
    expect(
      JSON.stringify(
        parse(
          '{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }'
        )
      )
    ).toBe(firstRes);
    expect(
      JSON.stringify(
        parse(
          '{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }'
        )
      )
    ).toBe(firstRes);
  });

  it('should allow you to use MessageFormat extension keywords other places, including in select keys', function () {
    // use `select` as a select key
    expect(parse('x {TEST, select, select{a} other{b} }')[1].cases[0].key).toBe(
      'select'
    );
    // use `offset` as a key (since it goes here in a `plural` case)
    expect(parse('x {TEST, select, offset{a} other{b} }')[1].cases[0].key).toBe(
      'offset'
    );
    // use the exact variable name as a key name
    expect(parse('x {TEST, select, TEST{a} other{b} }')[1].cases[0].key).toBe(
      'TEST'
    );
  });

  it("should be case-sensitive (select keyword is lowercase, everything else doesn't matter)", function () {
    expect(function () {
      parse('{TEST, Select, a{a} other{b}}');
    }).toThrow();
    expect(function () {
      parse('{TEST, SELECT, a{a} other{b}}');
    }).toThrow();
    expect(function () {
      parse('{TEST, selecT, a{a} other{b}}');
    }).toThrow();
  });

  it('should not accept keys with `=` prefixes', function () {
    expect(function () {
      parse('{TEST, select, =0{a} other{b}}');
    }).toThrow();
  });
});
describe('Plurals', function () {
  it('should accept a variable, no offset, and plural keys', function () {
    expect(function () {
      parse('{NUM, plural, one{1} other{2}}');
    }).not.toThrow();
  });

  it('should accept exact values with `=` prefixes', function () {
    expect(parse('{NUM, plural, =0{e1} other{2}}')[0].cases[0].key).toBe('0');
    expect(parse('{NUM, plural, =1{e1} other{2}}')[0].cases[0].key).toBe('1');
    expect(parse('{NUM, plural, =2{e1} other{2}}')[0].cases[0].key).toBe('2');
    expect(parse('{NUM, plural, =1{e1} other{2}}')[0].cases[1].key).toBe(
      'other'
    );
  });

  it('should accept the 6 official keywords', function () {
    // 'zero', 'one', 'two', 'few', 'many' and 'other'
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).toBe('zero');
    expect(
      parse(
        '{NUM, plural,   zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).toBe('zero');
    expect(
      parse(
        '{NUM, plural,zero    {0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).toBe('zero');
    expect(
      parse(
        '{NUM, plural,  \nzero\n   {0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).toBe('zero');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[1].key
    ).toBe('one');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[2].key
    ).toBe('two');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[3].key
    ).toBe('few');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[4].key
    ).toBe('many');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[5].key
    ).toBe('other');
  });

  it('should be gracious with whitespace', function () {
    var firstRes = JSON.stringify(parse('{NUM, plural, one{1} other{2}}'));
    expect(JSON.stringify(parse('{ NUM, plural, one{1} other{2} }'))).toBe(
      firstRes
    );
    expect(JSON.stringify(parse('{NUM,plural,one{1}other{2}}'))).toBe(firstRes);
    expect(
      JSON.stringify(
        parse('{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}')
      )
    ).toBe(firstRes);
    expect(
      JSON.stringify(
        parse('{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}')
      )
    ).toBe(firstRes);
  });

  it('should take an offset', function () {
    expect(parse('{NUM, plural, offset:4 other{a}}')).toBeTruthy();
    expect(parse('{NUM, plural, offset : 4 other{a}}')).toBeTruthy();
    expect(
      parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}')
    ).toBeTruthy();
    // technically this is parsable since js identifiers don't start with numbers
    expect(parse('{NUM,plural,offset:4other{a}}')).toBeTruthy();

    expect(parse('{NUM, plural, offset:4 other{a}}')[0].offset).toBe('4');
    expect(parse('{NUM,plural,offset:4other{a}}')[0].offset).toBe('4');
  });

  it('should support quoting', function () {
    expect(
      parse("{NUM, plural, one{{x,date,y-M-dd # '#'}} two{two}}")[0].cases[0]
        .tokens
    ).toMatchObject([
      {
        type: 'function',
        arg: 'x',
        key: 'date',
        param: {
          tokens: ['y-M-dd ', { type: 'octothorpe' }, ' #']
        }
      }
    ]);
    expect(
      parse("{NUM, plural, one{# '' #} two{two}}")[0].cases[0].tokens
    ).toMatchObject([{ type: 'octothorpe' }, " ' ", { type: 'octothorpe' }]);
    expect(
      parse("{NUM, plural, one{# '#'} two{two}}")[0].cases[0].tokens
    ).toMatchObject([{ type: 'octothorpe' }, ' #']);
    expect(
      parse('{NUM, plural, one{one#} two{two}}')[0].cases[0].tokens
    ).toMatchObject(['one', { type: 'octothorpe' }]);
  });

  it('should handle octothorpes with nested plurals', () => {
    const ast = parse('{x, plural, one{{y, plural, other{}}} other{#}}');
    expect(ast[0].cases[1].tokens[0]).toMatchObject({ type: 'octothorpe' });
  });

  describe('options.strict', function () {
    var src = "{NUM, plural, one{# {VAR,select,key{# '#' one#}}} two{two}}";

    it('should parse # correctly without strict option', function () {
      expect(parse(src)[0].cases[0].tokens[2].cases[0].tokens).toMatchObject([
        { type: 'octothorpe' },
        ' # one',
        { type: 'octothorpe' }
      ]);
    });

    it('should parse # correctly with strict option', function () {
      expect(
        parse(src, { strict: true })[0].cases[0].tokens[2].cases[0].tokens
      ).toMatchObject(["# '#' one#"]);
    });
  });
});
describe('Ordinals', function () {
  it('should accept a variable and ordinal keys', function () {
    expect(function () {
      parse('{NUM, selectordinal, one{1} other{2}}');
    }).not.toThrow();
  });

  it('should accept exact values with `=` prefixes', function () {
    expect(parse('{NUM, selectordinal, =0{e1} other{2}}')[0].cases[0].key).toBe(
      '0'
    );
    expect(parse('{NUM, selectordinal, =1{e1} other{2}}')[0].cases[0].key).toBe(
      '1'
    );
    expect(parse('{NUM, selectordinal, =2{e1} other{2}}')[0].cases[0].key).toBe(
      '2'
    );
    expect(parse('{NUM, selectordinal, =1{e1} other{2}}')[0].cases[1].key).toBe(
      'other'
    );
  });
});
describe('Functions', function () {
  it('should allow upper-case type, except for built-ins', function () {
    expect(function () {
      parse('{var,date}');
    }).not.toThrow();
    expect(function () {
      parse('{var,Date}');
    }).not.toThrow();
    expect(function () {
      parse('{var,Select}');
    }).toThrow();
    expect(function () {
      parse('{var,9ate}');
    }).toThrow();
  });

  it('should be gracious with whitespace around arg and key', function () {
    var expected = { type: 'function', arg: 'var', key: 'date', param: null };
    expect(parse('{var,date}')[0]).toMatchObject(expected);
    expect(parse('{var, date}')[0]).toMatchObject(expected);
    expect(parse('{ var, date }')[0]).toMatchObject(expected);
    expect(parse('{\nvar,   \ndate\n}')[0]).toMatchObject(expected);
  });

  it('should accept parameters', function () {
    expect(parse('{var,date,long}')[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ['long'] }
    });
    expect(parse('{var,date,long,short}')[0].param.tokens).toMatchObject([
      'long,short'
    ]);
  });

  it('should accept parameters with whitespace', function () {
    expect(parse('{var,date,y-M-d HH:mm:ss zzzz}')[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ['y-M-d HH:mm:ss zzzz'] }
    });
    expect(
      parse('{var,date,   y-M-d HH:mm:ss zzzz    }')[0].param.tokens
    ).toMatchObject(['   y-M-d HH:mm:ss zzzz    ']);
  });

  it('should accept parameters with special characters', function () {
    expect(parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz}")[0]).toMatchObject({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ["y-M-d {,} ' HH:mm:ss zzzz"] }
    });
    expect(
      parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz'}'}")[0].param.tokens
    ).toMatchObject(["y-M-d {,} ' HH:mm:ss zzzz}"]);
    expect(
      parse('{var,date,y-M-d # HH:mm:ss zzzz}')[0].param.tokens
    ).toMatchObject(['y-M-d # HH:mm:ss zzzz']);
    expect(
      parse("{var,date,y-M-d '#' HH:mm:ss zzzz}")[0].param.tokens
    ).toMatchObject(["y-M-d '#' HH:mm:ss zzzz"]);
    expect(
      parse('{var,date,y-M-d, HH:mm:ss zzzz}')[0].param.tokens
    ).toMatchObject(['y-M-d, HH:mm:ss zzzz']);
  });

  it('should accept parameters containing a basic variable', function () {
    expect(parse('{foo, date, {bar}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: { tokens: [' ', { arg: 'bar', type: 'argument' }] }
    });
  });

  it('should accept parameters containing a select', function () {
    expect(parse('{foo, date, {bar, select, other{baz}}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: {
        tokens: [
          ' ',
          {
            arg: 'bar',
            type: 'select',
            cases: [{ key: 'other', tokens: ['baz'] }]
          }
        ]
      }
    });
  });

  it('should accept parameters containing a plural', function () {
    expect(parse('{foo, date, {bar, plural, other{#}}}')[0]).toMatchObject({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: {
        tokens: [
          ' ',
          {
            arg: 'bar',
            type: 'plural',
            offset: 0,
            cases: [{ key: 'other', tokens: [{ type: 'octothorpe' }] }]
          }
        ]
      }
    });
  });

  describe('options.strict', function () {
    it('should require known function key with strict option', function () {
      expect(function () {
        parse('{foo, bar}');
      }).not.toThrow();
      expect(function () {
        parse('{foo, bar}', { strict: true });
      }).toThrow();
      expect(function () {
        parse('{foo, date}', { strict: true });
      }).not.toThrow();
    });

    it('parameter parsing should obey strict option', function () {
      expect(
        parse("{foo, date, {bar'}', quote'', other{#}}}", { strict: true })[0]
      ).toMatchObject({
        type: 'function',
        arg: 'foo',
        key: 'date',
        param: { tokens: [" {bar}, quote', other{#}}"] }
      });
    });

    it('should require matched braces in parameter if strict option is set', function () {
      expect(function () {
        parse('{foo, date, {bar{}}', { strict: true });
      }).toThrow();
    });
  });
});

describe('Nested/Recursive blocks', function () {
  it('should allow a select statement inside of a select statement', function () {
    expect(function () {
      parse('{NUM1, select, other{{NUM2, select, other{a}}}}');
    }).not.toThrow();
    expect(
      parse('{NUM1, select, other{{NUM2, select, other{a}}}}')[0].cases[0]
        .tokens[0].cases[0].tokens[0]
    ).toBe('a');

    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0]
    ).toBe('b');

    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).toBe('c');
  });

  it('should allow nested plural statements - with and without offsets', function () {
    expect(function () {
      parse('{NUM1, plural, other{{NUM2, plural, other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'
      );
    }).not.toThrow();

    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();

    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    // ok we get it, it's recursive.

    expect(
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).toBe('c');
  });

  it('should allow nested plural and select statements - with and without offsets', function () {
    expect(function () {
      parse('{NUM1, plural, other{{NUM2, select, other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse('{NUM1, select, other{{NUM2, plural, offset:1 other{a}}}}');
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'
      );
    }).not.toThrow();

    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).not.toThrow();

    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    expect(function () {
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).not.toThrow();
    // ok we get it, it's recursive.

    expect(
      parse(
        '{NUM1, selectordinal, other{{NUM2, plural, offset:1 other{{NUM3, selectordinal, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).toBe('c');
  });
});
describe('Errors', function () {
  it('should catch mismatched/invalid bracket situations', function () {
    expect(function () {
      parse('}');
    }).toThrow();
    expect(function () {
      parse('{');
    }).toThrow();
    expect(function () {
      parse('{{X}');
    }).toThrow();
    expect(function () {
      parse('{}');
    }).toThrow();
    expect(function () {
      parse('{}{');
    }).toThrow();
    expect(function () {
      parse('{X}{');
    }).toThrow();
    expect(function () {
      parse('}{}');
    }).toThrow();
    expect(function () {
      parse('}{X}');
    }).toThrow();
    expect(function () {
      parse('{}}');
    }).toThrow();
    expect(function () {
      parse('{X}}');
    }).toThrow();
    expect(function () {
      parse('{{X}}');
    }).toThrow();
    expect(function () {
      parse();
    }).toThrow();
    // Technically an empty string is valid.
    expect(function () {
      parse('');
    }).not.toThrow();
  });

  it('should not allow an offset for SELECTs', function () {
    expect(function () {
      parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}');
    }).toThrow();
  });

  it('should not allow invalid keys for PLURALs', function () {
    expect(function () {
      parse('{NUM, plural, one { 1 } invalid { error } other { 2 }}');
    }).toThrow();
    expect(function () {
      parse('{NUM, plural, one { 1 } some { error } other { 2 }}', {
        cardinal: ['one', 'other']
      });
    }).toThrow();
  });

  it('should not allow invalid keys for SELECTORDINALs', function () {
    expect(function () {
      parse('{NUM, selectordinal, one { 1 } invalid { error } other { 2 }}');
    }).toThrow();
    expect(function () {
      parse('{NUM, selectordinal, one { 1 } some { error } other { 2 }}', {
        ordinal: ['one', 'other']
      });
    }).toThrow();
  });

  it('should allow an offset for SELECTORDINALs', function () {
    expect(function () {
      parse('{NUM, selectordinal, offset:1 one { 1 } other { 2 }}');
    }).not.toThrow();
  });

  it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function () {
    expect(function () {
      parse('{☺}');
    }).toThrow();
    expect(function () {
      parse('{a☺}');
    }).toThrow();
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

  it('should require closing bracket', function () {
    const message = '{count, plural, one {car} other {cars}';
    expect(function () {
      parse(message);
    }).toThrow();
  });
});
