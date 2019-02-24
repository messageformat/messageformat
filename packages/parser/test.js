var expect = require('expect.js');
var fs = require('fs');
var peg = require('pegjs');

var parse = null;

describe('Parser generation', function() {
  it('should generate a valid parser from pegjs source', function() {
    var src = fs.readFileSync('./parser.pegjs', 'utf8');
    expect(src).to.not.be.empty();
    var parser = peg.generate(src);
    expect(parser.parse).to.be.a('function');
    parse = parser.parse;
  });
});
describe('Replacement', function() {
  it('should accept string only input', function() {
    expect(parse('This is a string')[0]).to.be('This is a string');
    expect(parse('☺☺☺☺')[0]).to.be('☺☺☺☺');
    expect(parse('This is \n a string')[0]).to.be('This is \n a string');
    expect(parse('中国话不用彁字。')[0]).to.be('中国话不用彁字。');
    expect(parse(' \t leading whitspace')[0]).to.be(' \t leading whitspace');
    expect(parse('trailing whitespace   \n  ')[0]).to.be(
      'trailing whitespace   \n  '
    );
  });

  it('should allow you to escape { and } characters', function() {
    expect(parse("'{'test")[0]).to.eql('{test');
    expect(parse("test'}'")[0]).to.eql('test}');
    expect(parse("'{test}'")[0]).to.eql('{test}');
  });

  it('should gracefully handle quotes (since it ends up in a JS String)', function() {
    expect(parse('This is a dbl quote: "')[0]).to.eql('This is a dbl quote: "');
    expect(parse("This is a single quote: '")[0]).to.eql(
      "This is a single quote: '"
    );
  });

  it('should accept only a variable', function() {
    expect(parse('{test}')).to.be.an('object');
    expect(parse('{0}')).to.be.an('object');
  });

  it('should not care about white space in a variable', function() {
    var targetStr = JSON.stringify(parse('{test}'));
    expect(JSON.stringify(parse('{test }'))).to.eql(targetStr);
    expect(JSON.stringify(parse('{ test}'))).to.eql(targetStr);
    expect(JSON.stringify(parse('{test  }'))).to.eql(targetStr);
    expect(JSON.stringify(parse('{  test}'))).to.eql(targetStr);
    expect(JSON.stringify(parse('{test}'))).to.eql(targetStr);
  });

  it('should maintain exact strings - not affected by variables', function() {
    expect(parse('x{test}')[0]).to.be('x');
    expect(parse('\n{test}')[0]).to.be('\n');
    expect(parse(' {test}')[0]).to.be(' ');
    expect(parse('x { test}')[0]).to.be('x ');
    expect(parse('x{test} x ')[2]).to.be(' x ');
    expect(parse('x\n{test}\n')[0]).to.be('x\n');
    expect(parse('x\n{test}\n')[2]).to.be('\n');
  });

  it('should handle extended character literals', function() {
    expect(parse('☺{test}')[0]).to.be('☺');
    expect(parse('中{test}中国话不用彁字。')[2]).to.be('中国话不用彁字。');
  });

  it("shouldn't matter if it has html or something in it", function() {
    expect(parse('<div class="test">content: {TEST}</div>')[0]).to.be(
      '<div class="test">content: '
    );
    expect(parse('<div class="test">content: {TEST}</div>')[1].arg).to.be(
      'TEST'
    );
    expect(parse('<div class="test">content: {TEST}</div>')[2]).to.be('</div>');
  });

  it('should allow you to use extension keywords for plural formats everywhere except where they go', function() {
    expect(parse('select select, ')[0]).to.eql('select select, ');
    expect(parse('select offset, offset:1 ')[0]).to.eql(
      'select offset, offset:1 '
    );
    expect(parse('one other, =1 ')[0]).to.eql('one other, =1 ');
    expect(parse('one {select} ')[1].arg).to.eql('select');
    expect(parse('one {plural} ')[1].arg).to.eql('plural');
  });

  it('should correctly handle apostrophes', function() {
    // This mirrors the default DOUBLE_OPTIONAL behavior of ICU.
    expect(parse("I see '{many}'")[0]).to.eql('I see {many}');
    expect(parse("I said '{''Wow!''}'")[0]).to.eql("I said {'Wow!'}");
    expect(parse("I don't know")[0]).to.eql("I don't know");
    expect(parse("I don''t know")[0]).to.eql("I don't know");
    expect(parse("A'a''a'A")[0]).to.eql("A'a'a'A");
    expect(parse("A'{a''a}'A")[0]).to.eql("A{a'a}A");

    // # and | are not special here.
    expect(parse("A '#' A")[0]).to.eql("A '#' A");
    expect(parse("A '|' A")[0]).to.eql("A '|' A");
  });
});
describe('Simple arguments', function() {
  it('should accept a statement based on a variable', function() {
    expect(function() {
      parse('{VAR}');
    }).to.not.throwError();
  });

  it('should be very whitespace agnostic', function() {
    var res = JSON.stringify(parse('{VAR}'));
    expect(JSON.stringify(parse('{VAR}'))).to.eql(res);
    expect(JSON.stringify(parse('{    VAR   }'))).to.eql(res);
    expect(JSON.stringify(parse('{ \n   VAR  \n}'))).to.eql(res);
    expect(JSON.stringify(parse('{ \t  VAR  \n }'))).to.eql(res);
  });

  it('should be correctly parsed', function() {
    expect(parse('{VAR}')[0].type).to.eql('argument');
    expect(parse('{VAR}')[0].arg).to.eql('VAR');
  });
});
describe('Selects', function() {
  it('should accept a select statement based on a variable', function() {
    expect(function() {
      parse('{VAR, select, key{a} other{b}}');
    }).to.not.throwError();
  });

  it('should be very whitespace agnostic', function() {
    var firstRes = JSON.stringify(parse('{VAR, select, key{a} other{b}}'));
    expect(JSON.stringify(parse('{VAR,select,key{a}other{b}}'))).to.eql(
      firstRes
    );
    expect(
      JSON.stringify(
        parse('{    VAR   ,    select   ,    key      {a}   other    {b}    }')
      )
    ).to.eql(firstRes);
    expect(
      JSON.stringify(
        parse(
          '{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }'
        )
      )
    ).to.eql(firstRes);
    expect(
      JSON.stringify(
        parse(
          '{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }'
        )
      )
    ).to.eql(firstRes);
  });

  it('should allow you to use MessageFormat extension keywords other places, including in select keys', function() {
    // use `select` as a select key
    expect(
      parse('x {TEST, select, select{a} other{b} }')[1].cases[0].key
    ).to.eql('select');
    // use `offset` as a key (since it goes here in a `plural` case)
    expect(
      parse('x {TEST, select, offset{a} other{b} }')[1].cases[0].key
    ).to.eql('offset');
    // use the exact variable name as a key name
    expect(parse('x {TEST, select, TEST{a} other{b} }')[1].cases[0].key).to.eql(
      'TEST'
    );
  });

  it("should be case-sensitive (select keyword is lowercase, everything else doesn't matter)", function() {
    expect(function() {
      var a = parse('{TEST, Select, a{a} other{b}}');
    }).to.throwError();
    expect(function() {
      var a = parse('{TEST, SELECT, a{a} other{b}}');
    }).to.throwError();
    expect(function() {
      var a = parse('{TEST, selecT, a{a} other{b}}');
    }).to.throwError();
  });

  it('should not accept keys with `=` prefixes', function() {
    expect(function() {
      var a = parse('{TEST, select, =0{a} other{b}}');
    }).to.throwError();
  });
});
describe('Plurals', function() {
  it('should accept a variable, no offset, and plural keys', function() {
    expect(function() {
      var a = parse('{NUM, plural, one{1} other{2}}');
    }).to.not.throwError();
  });

  it('should accept exact values with `=` prefixes', function() {
    expect(parse('{NUM, plural, =0{e1} other{2}}')[0].cases[0].key).to.eql(0);
    expect(parse('{NUM, plural, =1{e1} other{2}}')[0].cases[0].key).to.eql(1);
    expect(parse('{NUM, plural, =2{e1} other{2}}')[0].cases[0].key).to.eql(2);
    expect(parse('{NUM, plural, =1{e1} other{2}}')[0].cases[1].key).to.eql(
      'other'
    );
  });

  it('should accept the 6 official keywords', function() {
    // 'zero', 'one', 'two', 'few', 'many' and 'other'
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).to.eql('zero');
    expect(
      parse(
        '{NUM, plural,   zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).to.eql('zero');
    expect(
      parse(
        '{NUM, plural,zero    {0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).to.eql('zero');
    expect(
      parse(
        '{NUM, plural,  \nzero\n   {0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[0].key
    ).to.eql('zero');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[1].key
    ).to.eql('one');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[2].key
    ).to.eql('two');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[3].key
    ).to.eql('few');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[4].key
    ).to.eql('many');
    expect(
      parse(
        '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}'
      )[0].cases[5].key
    ).to.eql('other');
  });

  it('should be gracious with whitespace', function() {
    var firstRes = JSON.stringify(parse('{NUM, plural, one{1} other{2}}'));
    expect(JSON.stringify(parse('{ NUM, plural, one{1} other{2} }'))).to.eql(
      firstRes
    );
    expect(JSON.stringify(parse('{NUM,plural,one{1}other{2}}'))).to.eql(
      firstRes
    );
    expect(
      JSON.stringify(
        parse('{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}')
      )
    ).to.eql(firstRes);
    expect(
      JSON.stringify(
        parse('{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}')
      )
    ).to.eql(firstRes);
  });

  it('should take an offset', function() {
    expect(parse('{NUM, plural, offset:4 other{a}}')).to.be.ok();
    expect(parse('{NUM, plural, offset : 4 other{a}}')).to.be.ok();
    expect(parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}')).to.be.ok();
    // technically this is parsable since js identifiers don't start with numbers
    expect(parse('{NUM,plural,offset:4other{a}}')).to.be.ok();

    expect(parse('{NUM, plural, offset:4 other{a}}')[0].offset).to.eql(4);
    expect(parse('{NUM,plural,offset:4other{a}}')[0].offset).to.eql(4);
  });

  it('should support quoting', function() {
    expect(
      parse("{NUM, plural, one{{x,date,y-M-dd # '#'}} two{two}}")[0].cases[0]
        .tokens
    ).to.eql([
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
    ).to.eql([{ type: 'octothorpe' }, " ' ", { type: 'octothorpe' }]);
    expect(
      parse("{NUM, plural, one{# '#'} two{two}}")[0].cases[0].tokens
    ).to.eql([{ type: 'octothorpe' }, ' #']);
    expect(
      parse('{NUM, plural, one{one#} two{two}}')[0].cases[0].tokens
    ).to.eql(['one', { type: 'octothorpe' }]);
  });

  it('should handle octothorpes with nested plurals', () => {
    const ast = parse('{x, plural, one{{y, plural, other{}}} other{#}}');
    expect(ast[0].cases[1].tokens[0]).to.eql({ type: 'octothorpe' });
  });

  describe('options.strict', function() {
    var src = "{NUM, plural, one{# {VAR,select,key{# '#' one#}}} two{two}}";

    it('should parse # correctly without strict option', function() {
      expect(parse(src)[0].cases[0].tokens[2].cases[0].tokens).to.eql([
        { type: 'octothorpe' },
        ' # one',
        { type: 'octothorpe' }
      ]);
    });

    it('should parse # correctly with strict option', function() {
      expect(
        parse(src, { strict: true })[0].cases[0].tokens[2].cases[0].tokens
      ).to.eql(["# '#' one#"]);
    });
  });
});
describe('Ordinals', function() {
  it('should accept a variable and ordinal keys', function() {
    expect(function() {
      var a = parse('{NUM, selectordinal, one{1} other{2}}');
    }).to.not.throwError();
  });

  it('should accept exact values with `=` prefixes', function() {
    expect(
      parse('{NUM, selectordinal, =0{e1} other{2}}')[0].cases[0].key
    ).to.eql(0);
    expect(
      parse('{NUM, selectordinal, =1{e1} other{2}}')[0].cases[0].key
    ).to.eql(1);
    expect(
      parse('{NUM, selectordinal, =2{e1} other{2}}')[0].cases[0].key
    ).to.eql(2);
    expect(
      parse('{NUM, selectordinal, =1{e1} other{2}}')[0].cases[1].key
    ).to.eql('other');
  });
});
describe('Functions', function() {
  it('should require lower-case type', function() {
    expect(function() {
      parse('{var,date}');
    }).to.not.throwError();
    expect(function() {
      parse('{var,Date}');
    }).to.throwError();
    expect(function() {
      parse('{var,daTe}');
    }).to.throwError();
    expect(function() {
      parse('{var,9ate}');
    }).to.throwError();
  });

  it('should be gracious with whitespace around arg and key', function() {
    var expected = { type: 'function', arg: 'var', key: 'date', param: null };
    expect(parse('{var,date}')[0]).to.eql(expected);
    expect(parse('{var, date}')[0]).to.eql(expected);
    expect(parse('{ var, date }')[0]).to.eql(expected);
    expect(parse('{\nvar,   \ndate\n}')[0]).to.eql(expected);
  });

  it('should accept parameters', function() {
    expect(parse('{var,date,long}')[0]).to.eql({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ['long'] }
    });
    expect(parse('{var,date,long,short}')[0].param.tokens).to.eql([
      'long,short'
    ]);
  });

  it('should accept parameters with whitespace', function() {
    expect(parse('{var,date,y-M-d HH:mm:ss zzzz}')[0]).to.eql({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ['y-M-d HH:mm:ss zzzz'] }
    });
    expect(
      parse('{var,date,   y-M-d HH:mm:ss zzzz    }')[0].param.tokens
    ).to.eql(['   y-M-d HH:mm:ss zzzz    ']);
  });

  it('should accept parameters with special characters', function() {
    expect(parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz}")[0]).to.eql({
      type: 'function',
      arg: 'var',
      key: 'date',
      param: { tokens: ["y-M-d {,} ' HH:mm:ss zzzz"] }
    });
    expect(
      parse("{var,date,y-M-d '{,}' '' HH:mm:ss zzzz'}'}")[0].param.tokens
    ).to.eql(["y-M-d {,} ' HH:mm:ss zzzz}"]);
    expect(parse('{var,date,y-M-d # HH:mm:ss zzzz}')[0].param.tokens).to.eql([
      'y-M-d # HH:mm:ss zzzz'
    ]);
    expect(parse("{var,date,y-M-d '#' HH:mm:ss zzzz}")[0].param.tokens).to.eql([
      "y-M-d '#' HH:mm:ss zzzz"
    ]);
    expect(parse('{var,date,y-M-d, HH:mm:ss zzzz}')[0].param.tokens).to.eql([
      'y-M-d, HH:mm:ss zzzz'
    ]);
  });

  it('should accept parameters containing a basic variable', function() {
    expect(parse('{foo, date, {bar}}')[0]).to.eql({
      type: 'function',
      arg: 'foo',
      key: 'date',
      param: { tokens: [' ', { arg: 'bar', type: 'argument' }] }
    });
  });

  it('should accept parameters containing a select', function() {
    expect(parse('{foo, date, {bar, select, other{baz}}}')[0]).to.eql({
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

  it('should accept parameters containing a plural', function() {
    expect(parse('{foo, date, {bar, plural, other{#}}}')[0]).to.eql({
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

  describe('options.strict', function() {
    it('should require known function key with strict option', function() {
      expect(function() {
        parse('{foo, bar}');
      }).to.not.throwError();
      expect(function() {
        parse('{foo, bar}', { strict: true });
      }).to.throwError();
      expect(function() {
        parse('{foo, date}', { strict: true });
      }).to.not.throwError();
    });

    it('parameter parsing should obey strict option', function() {
      expect(
        parse("{foo, date, {bar'}', quote'', other{#}}}", { strict: true })[0]
      ).to.eql({
        type: 'function',
        arg: 'foo',
        key: 'date',
        param: { tokens: [" {bar}, quote', other{#}}"] }
      });
    });

    it('should require matched braces in parameter if strict option is set', function() {
      expect(function() {
        parse('{foo, date, {bar{}}', { strict: true });
      }).to.throwError();
    });
  });
});

describe('Nested/Recursive blocks', function() {
  it('should allow a select statement inside of a select statement', function() {
    expect(function() {
      var a = parse('{NUM1, select, other{{NUM2, select, other{a}}}}');
    }).to.not.throwError();
    expect(
      parse('{NUM1, select, other{{NUM2, select, other{a}}}}')[0].cases[0]
        .tokens[0].cases[0].tokens[0]
    ).to.eql('a');

    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0]
    ).to.eql('b');

    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(
      parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).to.eql('c');
  });

  it('should allow nested plural statements - with and without offsets', function() {
    expect(function() {
      var a = parse('{NUM1, plural, other{{NUM2, plural, other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'
      );
    }).to.not.throwError();

    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();

    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    // ok we get it, it's recursive.

    expect(
      parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).to.eql('c');
  });

  it('should allow nested plural and select statements - with and without offsets', function() {
    expect(function() {
      var a = parse('{NUM1, plural, other{{NUM2, select, other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse('{NUM1, select, other{{NUM2, plural, offset:1 other{a}}}}');
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'
      );
    }).to.not.throwError();

    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'
      );
    }).to.not.throwError();

    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    expect(function() {
      var a = parse(
        '{NUM1, select, other{{NUM2, select, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      );
    }).to.not.throwError();
    // ok we get it, it's recursive.

    expect(
      parse(
        '{NUM1, selectordinal, other{{NUM2, plural, offset:1 other{{NUM3, selectordinal, other{{NUM4, plural, offset:1 other{c}}}}}}}}'
      )[0].cases[0].tokens[0].cases[0].tokens[0].cases[0].tokens[0].cases[0]
        .tokens[0]
    ).to.eql('c');
  });
});
describe('Errors', function() {
  it('should catch mismatched/invalid bracket situations', function() {
    expect(function() {
      parse('}');
    }).to.throwError();
    expect(function() {
      parse('{');
    }).to.throwError();
    expect(function() {
      parse('{{X}');
    }).to.throwError();
    expect(function() {
      parse('{}');
    }).to.throwError();
    expect(function() {
      parse('{}{');
    }).to.throwError();
    expect(function() {
      parse('{X}{');
    }).to.throwError();
    expect(function() {
      parse('}{}');
    }).to.throwError();
    expect(function() {
      parse('}{X}');
    }).to.throwError();
    expect(function() {
      parse('{}}');
    }).to.throwError();
    expect(function() {
      parse('{X}}');
    }).to.throwError();
    expect(function() {
      parse('{{X}}');
    }).to.throwError();
    expect(function() {
      parse();
    }).to.throwError();
    // Technically an empty string is valid.
    expect(function() {
      parse('');
    }).to.not.throwError();
  });

  it('should not allow an offset for SELECTs', function() {
    expect(function() {
      parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}');
    }).to.throwError();
  });

  it('should not allow invalid keys for PLURALs', function() {
    expect(function() {
      parse('{NUM, plural, one { 1 } invalid { error } other { 2 }}');
    }).to.throwError();
    expect(function() {
      parse('{NUM, plural, one { 1 } some { error } other { 2 }}', {
        cardinal: ['one', 'other']
      });
    }).to.throwError();
  });

  it('should not allow invalid keys for SELECTORDINALs', function() {
    expect(function() {
      parse('{NUM, selectordinal, one { 1 } invalid { error } other { 2 }}');
    }).to.throwError();
    expect(function() {
      parse('{NUM, selectordinal, one { 1 } some { error } other { 2 }}', {
        ordinal: ['one', 'other']
      });
    }).to.throwError();
  });

  it('should allow an offset for SELECTORDINALs', function() {
    expect(function() {
      parse('{NUM, selectordinal, offset:1 one { 1 } other { 2 }}');
    }).to.not.throwError();
  });

  it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function() {
    expect(function() {
      parse('{☺}');
    }).to.throwError();
    expect(function() {
      parse('{a☺}');
    }).to.throwError();
  });

  it('should allow characters in variables that are valid ICU identifiers', function() {
    expect(function() {
      parse('{ű\u3000á}');
    }).to.not.throwError();
  });

  it('should allow positional variables', function() {
    expect(function() {
      parse('{0}');
    }).to.not.throwError();
  });

  it('should throw errors on negative offsets', function() {
    expect(function() {
      parse('{NUM, plural, offset:-4 other{a}}');
    }).to.throwError();
  });

  it('should require closing bracket', function() {
    const message = '{count, plural, one {car} other {cars}';
    expect(function() {
      parse(message);
    }).to.throwError();
  });
});
