if (typeof require !== 'undefined') {
  var expect = require('chai').expect;
  var MessageFormat = require('../packages/messageformat');
}

describe('new MessageFormat()', function() {
  it('should exist', function() {
    expect(MessageFormat).to.be.a('function');
  });

  it('should be a constructor', function() {
    const mf = new MessageFormat('en');
    expect(mf).to.be.an.instanceof(MessageFormat);
  });

  it('should have a compile() function', function() {
    const mf = new MessageFormat('en');
    expect(mf.compile).to.be.a('function');
  });

  it('should fallback when a base pluralFunc exists', function() {
    const mf = new MessageFormat('en-x-test1-test2');
    expect(mf.pluralFuncs['en-x-test1-test2']).to.be.a('function');
  });

  it('should fallback when a base pluralFunc exists (underscores)', function() {
    const mf = new MessageFormat('en_x_test1_test2');
    expect(mf.pluralFuncs['en_x_test1_test2']).to.be.a('function');
  });

  it('should bail on non-existing locales', function() {
    expect(function() {
      new MessageFormat('lawlz');
    }).to.throw();
  });

  it('should default to `en` when no locale is passed into the constructor', function() {
    expect(new MessageFormat().defaultLocale).to.eql('en');
  });
});

describe('compile()', function() {
  let mf;
  beforeEach(function() {
    mf = new MessageFormat('en');
  });

  it('should exist', function() {
    expect(mf.compile).to.be.a('function');
  });

  it('compiles a string to a function', function() {
    expect(mf.compile('test')).to.be.a('function');
  });

  it('can output a non-formatted string', function() {
    expect(mf.compile('This is a string.')()).to.eql('This is a string.');
  });

  it('throws an error when no `other` option is found - plurals', function() {
    expect(function() {
      mf.compile('{X, plural, someoption{a}}');
    }).to.throw();
  });

  it('throws an error when no `other` option is found - selects', function() {
    expect(function() {
      mf.compile('{X, select, someoption{a}}');
    }).to.throw();
  });

  it('throws an error when no `other` option is found - selectordinals', function() {
    expect(function() {
      mf.compile('{X, selectordinal, someoption{a}}');
    }).to.throw();
  });

  it('does not throw an error when no `other` option is found - plurals with custom pluralFunc', function() {
    function fake(x, ord) {
      return ord ? 'few' : 'some';
    }
    fake.cardinal = ['some'];
    fake.ordinal = ['few'];
    mf = new MessageFormat({ fake: fake });
    expect(function() {
      mf.compile('{X, plural, some{a}}');
    }).to.not.throw();
  });

  it('should use the locale plural function', function() {
    mf = new MessageFormat('cy');
    const mfunc = mf.compile(
      '{num, plural, zero{0} one{1} two{2} few{3} many{6} other{+}}'
    );
    expect(mfunc.toString()).to.match(/\bcy\b/);
    expect(mfunc({ num: 5 })).to.equal('+');
  });

  it('should use the locale selectordinal function', function() {
    mf = new MessageFormat('cy');
    const mfunc = mf.compile(
      '{num, selectordinal, zero{0,7,8,9} one{1} two{2} few{3,4} many{5,6} other{+}}'
    );
    expect(mfunc.toString()).to.match(/\bcy\b/);
    expect(mfunc({ num: 5 })).to.equal('5,6');
  });

  it('should have configurable # parsing support', function() {
    const msg = '{X, plural, one{#} other{{Y, select, other{#}}}}';
    const msg2 = "{X, plural, one{#} other{{Y, select, other{'#'}}}}";
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.equal(3);
    expect(mf.compile(msg)({ X: 'x' })).to.equal('x');
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.equal('#');
    expect(mf.compile(msg2)({ X: 'x' })).to.equal('#');
    mf.setStrictNumberSign(true);
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.equal('#');
    expect(function() {
      mf.compile(msg)({ X: 'x' });
    }).to.throw(/\bX\b.*non-numerical value/);
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.equal("'#'");
    mf.setStrictNumberSign(false);
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.equal(3);
    expect(mf.compile(msg)({ X: 'x' })).to.equal('x');
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.equal('#');
    expect(mf.compile(msg2)({ X: 'x' })).to.equal('#');
  });

  it('can compile an object of messages into a function', function() {
    const data = {
      key: 'I have {FRIENDS, plural, one{one friend} other{# friends}}.'
    };
    const mfunc = mf.compile(data);
    expect(mfunc).to.be.an('object');
    expect(mfunc.toString()).to.match(/\bkey\b/);

    expect(mfunc.key).to.be.a('function');
    expect(mfunc.key({ FRIENDS: 1 })).to.eql('I have one friend.');
    expect(mfunc.key({ FRIENDS: 2 })).to.eql('I have 2 friends.');
  });

  it('can compile an object enclosing reserved JavaScript words used as keys in quotes', function() {
    const data = {
      default: 'default is a JavaScript reserved word so should be quoted',
      unreserved:
        'unreserved is not a JavaScript reserved word so should not be quoted'
    };
    const mfunc = mf.compile(data);
    expect(mfunc.toString()).to.match(/"default"/);
    expect(mfunc.toString()).to.match(/[^"]unreserved[^"]/);

    expect(mfunc['default']).to.be.a('function');
    expect(mfunc['default']()).to.eql(
      'default is a JavaScript reserved word so should be quoted'
    );

    expect(mfunc.unreserved).to.be.a('function');
    expect(mfunc.unreserved()).to.eql(
      'unreserved is not a JavaScript reserved word so should not be quoted'
    );
  });

  it('can be instantiated multiple times for multiple languages', function() {
    const mf = {
      en: new MessageFormat('en'),
      ru: new MessageFormat('ru')
    };
    const cf = {
      en: mf.en.compile('{count} {count, plural, other{users}}'),
      ru: mf.ru.compile('{count} {count, plural, other{пользователей}}')
    };
    expect(function() {
      cf.en({ count: 12 });
    }).to.not.throw();
    expect(cf.en({ count: 12 })).to.eql('12 users');
    expect(function() {
      cf.ru({ count: 13 });
    }).to.not.throw();
    expect(cf.ru({ count: 13 })).to.eql('13 пользователей');
  });

  function printLocale(v, lc) {
    return lc;
  }

  it('can support multiple languages', function() {
    mf = new MessageFormat(['en', 'fr', 'ru']);
    mf.addFormatters({ lc: printLocale });
    const cf = mf.compile({
      fr: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('defaults to supporting all languages: compile({ fr, ru })', function() {
    mf = new MessageFormat();
    mf.addFormatters({ lc: printLocale });
    const cf = mf.compile({
      fr: 'Locale: {_, lc}',
      xx: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.xx({})).to.eql('Locale: en');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('defaults to supporting all languages: compile(src, locale)', function() {
    mf = new MessageFormat();
    mf.addFormatters({ lc: printLocale });
    const cf0 = mf.compile('Locale: {_, lc}', 'fr');
    expect(cf0({})).to.eql('Locale: fr');
    const cf1 = mf.compile(
      {
        fr: 'Locale: {_, lc}',
        en: '{count, plural, one{1} few{2} many{3} other{x:#}}'
      },
      'ru-RU'
    );
    expect(cf1.fr({})).to.eql('Locale: ru-RU');
    expect(cf1.en({ count: 12 })).to.eql('3');
  });
});

describe('Basic Message Formatting', function() {
  it('gets non-ascii character all the way through.', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile('中{test}中国话不用彁字。')({ test: '☺' })).to.eql(
      '中☺中国话不用彁字。'
    );
  });

  it('escapes double quotes', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile('She said "Hello"')()).to.eql('She said "Hello"');
  });

  it('should handle apostrophes correctly', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile("I see '{many}'")()).to.eql('I see {many}');
    expect(mf.compile("I said '{''Wow!''}'")()).to.eql("I said {'Wow!'}");
    expect(mf.compile("I don't know")()).to.eql("I don't know");
    expect(mf.compile("I don''t know")()).to.eql("I don't know");
  });

  it('accepts escaped special characters', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile("'{'")()).to.eql('{');
    expect(mf.compile("'}'")()).to.eql('}');
  });

  it('accepts special characters escaped with MessageFormat.escape', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile(MessageFormat.escape('{'))()).to.eql('{');
    expect(mf.compile(MessageFormat.escape('}'))()).to.eql('}');
    expect(mf.compile(MessageFormat.escape('#'))()).to.eql('#');
    expect(mf.compile(MessageFormat.escape('#', true))()).to.eql("'#'");
  });

  it('should get escaped brackets all the way out the other end', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile("'{{{'")()).to.eql('{{{');
    expect(mf.compile("'}}}'")()).to.eql('}}}');
    expect(mf.compile("'{{{'{test}'}}}'")({ test: 4 })).to.eql('{{{4}}}');
    expect(
      mf.compile("'{{{'{test, plural, other{#}}'}}}'")({ test: 4 })
    ).to.eql('{{{4}}}');
  });

  it('can substitute named variables', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile('The var is {VAR}.')({ VAR: 5 })).to.eql('The var is 5.');
  });

  it('can substitute positional variables', function() {
    var mf = new MessageFormat('en');
    expect(mf.compile('The var is {0}.')({ '0': 5 })).to.eql('The var is 5.');
    expect(mf.compile('The var is {0}.')([5])).to.eql('The var is 5.');
    expect(mf.compile('The vars are {0} and {1}.')([5, -3])).to.eql(
      'The vars are 5 and -3.'
    );
    expect(mf.compile('The vars are {0} and {01}.')([5, -3])).to.eql(
      'The vars are 5 and undefined.'
    );
  });

  it('can substitute shorthand variables', function() {
    var mf = new MessageFormat('en');
    expect(
      mf.compile('{VAR, plural, other{The var is #.}}')({ VAR: 5 })
    ).to.eql('The var is 5.');
    expect(mf.compile('{0, plural, other{The var is #.}}')([5])).to.eql(
      'The var is 5.'
    );
    expect(
      mf.compile('{VAR, plural, offset:1 other{The var is #.}}')({ VAR: 5 })
    ).to.eql('The var is 4.');
    expect(
      mf.compile('{X, plural, other{{Y, select, other{The var is #.}}}}')({
        X: 5,
        Y: 'key'
      })
    ).to.eql('The var is 5.');
  });

  it('allows escaped shorthand variable: #', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("{X, plural, other{# is a '#'}}");
    expect(mfunc({ X: 3 })).to.eql('3 is a #');
  });

  it('should not substitute octothorpes that are outside of curly braces', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('This is an octothorpe: #');
    expect(mfunc({ X: 3 })).to.eql('This is an octothorpe: #');
  });

  it('obeys plural functions', function() {
    var mf = new MessageFormat({
      fake: function(x) {
        return 'few';
      }
    });
    expect(
      mf.compile('res: {val, plural, few{wasfew} other{failed}}')({ val: 0 })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, plural, few{wasfew} other{failed}}')({ val: 1 })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, plural, few{wasfew} other{failed}}')({ val: 2 })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, plural, few{wasfew} other{failed}}')({ val: 3 })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, plural, few{wasfew} other{failed}}')({})
    ).to.equal('res: wasfew');
  });

  it('obeys selectordinal functions', function() {
    var mf = new MessageFormat({
      fake: function(x, ord) {
        return ord ? 'few' : 'other';
      }
    });
    expect(
      mf.compile('res: {val, selectordinal, few{wasfew} other{failed}}')({
        val: 0
      })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, selectordinal, few{wasfew} other{failed}}')({
        val: 1
      })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, selectordinal, few{wasfew} other{failed}}')({
        val: 2
      })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, selectordinal, few{wasfew} other{failed}}')({
        val: 3
      })
    ).to.equal('res: wasfew');
    expect(
      mf.compile('res: {val, selectordinal, few{wasfew} other{failed}}')({})
    ).to.equal('res: wasfew');
  });

  it('only calculates the offset from non-literals', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('{NUM, plural, offset:1 =0{a} one{b} other{c}}');
    expect(mfunc({ NUM: 0 })).to.eql('a');
    expect(mfunc({ NUM: 1 })).to.eql('c');
    expect(mfunc({ NUM: 2 })).to.eql('b');
  });

  it('should obey `i=0 and v=0` rules', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('{NUM, plural, one{a} other{b}}');
    expect(mfunc({ NUM: '1' })).to.eql('a');
    expect(mfunc({ NUM: '1.0' })).to.eql('b');
  });

  it('should give priority to literals', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('{NUM, plural, =34{a} one{b} other{c}}');
    expect(mfunc({ NUM: 34 })).to.eql('a');
  });

  it("should throw an error when you don't pass it any data, but it expects it", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('{NEEDSDATAYO}');
    expect(function() {
      var z = mfunc();
    }).to.throw();
  });

  it("should not throw an error when you don't pass it any data, but it expects none", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('Just a string');
    expect(function() {
      var z = mfunc();
    }).to.not.throw();
  });

  it('should be able to disable plural checks', function() {
    var mf0 = new MessageFormat('en');
    var mf1 = new MessageFormat('en');
    var msg = '{X, plural, zero{none} one{one} other{some: #}}';
    expect(function() {
      mf0.compile(msg);
    }).to.throw();
    mf0.disablePluralKeyChecks();
    expect(mf0.compile(msg)({ X: 0 })).to.eql('some: 0');
    expect(function() {
      mf1.compile(msg);
    }).to.throw();
  });

  it('should add control codes to bidirectional text', function() {
    var msg = '{0} >> {1}';
    var data = ['Hello! English', 'Hello \u0647\u0644\u0627\u060d'];
    var mfEn = new MessageFormat('en').setBiDiSupport(true);
    var mfEg = new MessageFormat('ar-EG').setBiDiSupport(true);
    expect(mfEn.compile(msg)(data)).to.equal(
      '\u200eHello! English\u200e >> \u200eHello \u0647\u0644\u0627\u060d\u200e'
    );
    expect(mfEg.compile(msg)(data)).to.equal(
      '\u200fHello! English\u200f >> \u200fHello \u0647\u0644\u0627\u060d\u200f'
    );
  });

  it('should allow for a simple select', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'I am {FEELING, select, a{happy} b{sad} other{indifferent}}.'
    );
    expect(mfunc({ FEELING: 'a' })).to.eql('I am happy.');
    expect(mfunc({ FEELING: 'b' })).to.eql('I am sad.');
    expect(mfunc({ FEELING: 'q' })).to.eql('I am indifferent.');
    expect(mfunc({})).to.eql('I am indifferent.');
  });

  it('should allow for a simple plural form', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'I have {FRIENDS, plural, one{one friend} other{# friends}}.'
    );
    expect(mfunc({ FRIENDS: 0 })).to.eql('I have 0 friends.');
    expect(mfunc({ FRIENDS: 1 })).to.eql('I have one friend.');
    expect(mfunc({ FRIENDS: 2 })).to.eql('I have 2 friends.');
  });

  it('should allow for a simple selectordinal form', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'The {FLOOR, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} floor.'
    );
    expect(mfunc({ FLOOR: 0 })).to.eql('The 0th floor.');
    expect(mfunc({ FLOOR: 1 })).to.eql('The 1st floor.');
    expect(mfunc({ FLOOR: 2 })).to.eql('The 2nd floor.');
  });

  it("should reject number injections of numbers that don't exist", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'I have {FRIENDS, plural, one{one friend} other{# friends but {ENEMIES, plural, offset:1 ' +
        '=0{no enemies} =1{one nemesis} one{two enemies} other{one nemesis and # enemies}}}}.'
    );
    expect(mfunc({ FRIENDS: 0, ENEMIES: 0 })).to.eql(
      'I have 0 friends but no enemies.'
    );
    expect(function() {
      var x = mfunc({});
    }).to.throw(/\bENEMIES\b.*non-numerical value/);
    expect(function() {
      var x = mfunc({ FRIENDS: 0 });
    }).to.throw(/\bENEMIES\b.*non-numerical value/);
    expect(mfunc({ ENEMIES: 1 })).to.eql(
      'I have undefined friends but one nemesis.'
    );
  });

  it('should not expose prototype members - selects', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'I am {FEELING, select, a{happy} hasOwnProperty{evil} other{indifferent}}.'
    );
    expect(mfunc({ FEELING: 'toString' })).to.eql('I am indifferent.');
  });

  it('should not expose prototype members - plurals', function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      'I have {FRIENDS, plural, one{one friend} other{friends}}.'
    );
    expect(mfunc({ FRIENDS: 'toString' })).to.eql('I have friends.');
  });
});
describe('Real World Uses', function() {
  it('can correctly pull in a different pluralization rule set', function() {
    // note, cy.js was included in the html file for the browser
    // and then in the common.js file
    var mf = new MessageFormat('cy');
    var mfunc = mf.compile(
      '{NUM, plural, zero{a} one{b} two{c} few{d} many{e} other{f} =42{omg42}}'
    );
    expect(mfunc({ NUM: 0 })).to.eql('a');
    expect(mfunc({ NUM: 1 })).to.eql('b');
    expect(mfunc({ NUM: 2 })).to.eql('c');
    expect(mfunc({ NUM: 3 })).to.eql('d');
    expect(mfunc({ NUM: 6 })).to.eql('e');
    expect(mfunc({ NUM: 15 })).to.eql('f');
    expect(mfunc({ NUM: 42 })).to.eql('omg42');
  });

  it('can parse complex, real-world messages with nested selects and plurals with offsets', function() {
    var input =
      '' +
      '{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1' +
      '     =0 {no one}' +
      '     =1 {just {GENDER, select, male {him} female {her} other{them}}self}' +
      '    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}' +
      '  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}' +
      '} to {GENDER, select,' +
      '   male {his}' +
      ' female {her}' +
      '  other {their}' +
      '} group.';

    var mf = new MessageFormat('en');
    var mfunc = mf.compile(input);

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 0,
        PERSON: 'Allie Sexton',
        GENDER: 'female'
      })
    ).to.eql('Allie Sexton added no one to her group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 1,
        PERSON: 'Allie Sexton',
        GENDER: 'female'
      })
    ).to.eql('Allie Sexton added just herself to her group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 2,
        PERSON: 'Allie Sexton',
        GENDER: 'female'
      })
    ).to.eql('Allie Sexton added herself and one other person to her group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 3,
        PERSON: 'Allie Sexton',
        GENDER: 'female'
      })
    ).to.eql('Allie Sexton added herself and 2 other people to her group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 0,
        PERSON: 'Alex Sexton',
        GENDER: 'male'
      })
    ).to.eql('Alex Sexton added no one to his group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 1,
        PERSON: 'Alex Sexton',
        GENDER: 'male'
      })
    ).to.eql('Alex Sexton added just himself to his group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 2,
        PERSON: 'Alex Sexton',
        GENDER: 'male'
      })
    ).to.eql('Alex Sexton added himself and one other person to his group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 3,
        PERSON: 'Alex Sexton',
        GENDER: 'male'
      })
    ).to.eql('Alex Sexton added himself and 2 other people to his group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 0,
        PERSON: 'Al Sexton'
      })
    ).to.eql('Al Sexton added no one to their group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 1,
        PERSON: 'Al Sexton'
      })
    ).to.eql('Al Sexton added just themself to their group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 2,
        PERSON: 'Al Sexton'
      })
    ).to.eql('Al Sexton added themself and one other person to their group.');

    expect(
      mfunc({
        PLURAL_NUM_PEOPLE: 3,
        PERSON: 'Al Sexton'
      })
    ).to.eql('Al Sexton added themself and 2 other people to their group.');
  });

  it('handles octothorpes with nested plurals', function() {
    var mf = new MessageFormat('en');
    const msg = mf.compile(
      '{HOURS, plural, =0 {{MINUTES, plural, =0 {{SECONDS, plural, =0 {} other {#s}}} other {#m {SECONDS}s}}} other {#h {MINUTES}m {SECONDS}s}}'
    );
    const data = {
      HOURS: 1,
      MINUTES: 10,
      SECONDS: 15
    };
    expect(msg(data)).to.match(/^1h 10m 15s/);
  });
});

describe('Module/CommonJS support', function() {
  var colorSrc = { red: 'red', blue: 'blue', green: 'green' };
  var cf = new MessageFormat('en').compile(colorSrc);

  it('should default to ES6', function() {
    var str = cf.toString();
    expect(str).to.match(/export default/);
  });

  if (typeof require !== 'undefined') {
    ['module.exports', 'global.i18n', 'umd'].forEach(function(moduleFmt) {
      it('should work with `' + moduleFmt + '`', function(done) {
        var fs = require('fs');
        var tmp = require('tmp');
        tmp.file({ postfix: '.js' }, function(err, path, fd) {
          if (err) throw err;
          fs.write(fd, cf.toString(moduleFmt), 0, 'utf8', function(err) {
            if (err) throw err;
            var colors = require(path);
            var gm = /^global\.(.*)/i.exec(moduleFmt);
            if (gm) {
              expect(colors.red).to.equal(undefined);
              colors = global[gm[1]];
            }
            expect(colors).to.be.an('object');
            expect(colors.red()).to.eql('red');
            expect(colors.blue()).to.eql('blue');
            expect(colors.green()).to.eql('green');
            done();
          });
        });
      });
    });
  } else {
    var moduleFmt = 'window.i18n';
    it('should work with `' + moduleFmt + '`', function() {
      eval(cf.toString(moduleFmt));
      expect(window).to.have.property('i18n');
      var colors = window.i18n;
      expect(colors.red()).to.eql('red');
      expect(colors.blue()).to.eql('blue');
      expect(colors.green()).to.eql('green');
    });
  }
});
