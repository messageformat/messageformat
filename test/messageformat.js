if (typeof require !== 'undefined') {
  var expect = require('expect.js');
  var MessageFormat = require('../');
}

describe("Public API", function() {

  it("should exist", function() {
    expect(MessageFormat).to.be.a('function');
  });

  it("should be a constructor", function() {
    var mf = new MessageFormat('en');
    expect(mf).to.be.a(MessageFormat);
  });

  it("should have a compile() function", function() {
    var mf = new MessageFormat('en');
    expect(mf.compile).to.be.a('function');
  });

  it("should fallback when a base pluralFunc exists", function() {
    var mf = new MessageFormat('en-x-test1-test2');
    expect(mf.pluralFuncs['en-x-test1-test2']).to.be.a('function');
  });

  it("should fallback when a base pluralFunc exists (underscores)", function() {
    var mf = new MessageFormat('en_x_test1_test2');
    expect(mf.pluralFuncs['en_x_test1_test2']).to.be.a('function');
  });

  it("should bail on non-existing locales", function() {
    expect(function(){ var a = new MessageFormat('lawlz'); }).to.throwError();
  });

  it("should default to 'en' when no locale is passed into the constructor", function() {
    expect(MessageFormat.defaultLocale).to.eql('en');
  });

});
describe("Basic Message Formatting", function() {

  it("has a compile function", function() {
    var mf = new MessageFormat('en');
    expect(mf.compile).to.be.a('function');
  });

  it("compiles to a function", function() {
    var mf = new MessageFormat('en');
    expect(mf.compile("test")).to.be.a('function');
  });

  it("can output a non-formatted string", function() {
    var mf = new MessageFormat('en');

    expect((mf.compile("This is a string."))()).to.eql("This is a string.");
  });

  it("gets non-ascii character all the way through.", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile('中{test}中国话不用彁字。'))({test:"☺"})).to.eql("中☺中国话不用彁字。");
  });

  it("escapes double quotes", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile('She said "Hello"'))()).to.eql('She said "Hello"');
  });

  it("escapes backslashes (regression test for #99)", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile('\\u005c'))()).to.eql('\\');
  });

  it("should handle apostrophes correctly", function() {
    var mf = new MessageFormat('en');
    expect(mf.compile("I see '{many}'")()).to.eql("I see {many}");
    expect(mf.compile("I said '{''Wow!''}'")()).to.eql("I said {'Wow!'}");
    expect(mf.compile("I don't know")()).to.eql("I don't know");
    expect(mf.compile("I don''t know")()).to.eql("I don't know");
  });

  it("accepts escaped special characters", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile('\\{'))()).to.eql('{');
    expect((mf.compile('\\}'))()).to.eql('}');
    expect((mf.compile('\\#'))()).to.eql('#');
    expect((mf.compile('\\\\'))()).to.eql('\\');
    expect((mf.compile('\\u263A\\u263B'))()).to.eql('☺☻');
  });

  it("accepts special characters escaped with MessageFormat.escape", function() {
    var mf = new MessageFormat('en');
    expect(mf.compile(MessageFormat.escape('{'))()).to.eql('{');
    expect(mf.compile(MessageFormat.escape('}'))()).to.eql('}');
    expect(mf.compile(MessageFormat.escape('#'))()).to.eql('#');
    expect(mf.compile(MessageFormat.escape('\\'))()).to.eql('\\');
  });

  it("should get escaped brackets all the way out the other end", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile('\\{\\{\\{'))()).to.eql("{{{");
    expect((mf.compile('\\}\\}\\}'))()).to.eql("}}}");
    expect((mf.compile('\\{\\{\\{{test}\\}\\}\\}'))({test:4})).to.eql("{{{4}}}");
    expect((mf.compile('\\{\\{\\{{test, plural, other{#}}\\}\\}\\}'))({test:4})).to.eql("{{{4}}}");
  });

  it("can substitute named variables", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile("The var is {VAR}."))({"VAR":5})).to.eql("The var is 5.");
  });

  it("can substitute positional variables", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile("The var is {0}."))({"0":5})).to.eql("The var is 5.");
    expect((mf.compile("The var is {0}."))([5])).to.eql("The var is 5.");
    expect((mf.compile("The vars are {0} and {1}."))([5,-3])).to.eql("The vars are 5 and -3.");
    expect((mf.compile("The vars are {0} and {01}."))([5,-3])).to.eql("The vars are 5 and undefined.");
  });

  it("can substitute shorthand variables", function() {
    var mf = new MessageFormat('en');
    expect((mf.compile("{VAR, plural, other{The var is #.}}"))({ VAR: 5 })).to.eql("The var is 5.");
    expect((mf.compile("{0, plural, other{The var is #.}}"))([5])).to.eql("The var is 5.");
    expect((mf.compile("{VAR, plural, offset:1 other{The var is #.}}"))({ VAR: 5 })).to.eql("The var is 4.");
    expect((mf.compile("{X, plural, other{{Y, select, other{The var is #.}}}}"))({ X: 5, Y: 'key' })).to.eql("The var is 5.");
  });

  it("allows escaped shorthand variable: #", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('{X, plural, other{# is a \\#}}');
    expect(mfunc({X:3})).to.eql("3 is a #");
  });

  it("should not substitute octothorpes that are outside of curly braces", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile('This is an octothorpe: #');
    expect(mfunc({X:3})).to.eql("This is an octothorpe: #");
  });

  it("should have configurable # parsing support", function() {
    var mf = new MessageFormat('en');
    var msg = '{X, plural, one{#} other{{Y, select, other{#}}}}';
    var msg2 = "{X, plural, one{#} other{{Y, select, other{'#'}}}}";
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.eql('3');
    expect(mf.compile(msg)({ X: 'x' })).to.eql('x');
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.eql('#');
    expect(mf.compile(msg2)({ X: 'x' })).to.eql('#');
    mf.setStrictNumberSign(true);
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.eql('#');
    expect(function() { mf.compile(msg)({ X: 'x' }); }).to.throwError(/\bX\b.*non-numerical value/);
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.eql("'#'");
    mf.setStrictNumberSign(false);
    expect(mf.compile(msg)({ X: 3, Y: 5 })).to.eql('3');
    expect(mf.compile(msg)({ X: 'x' })).to.eql('x');
    expect(mf.compile(msg2)({ X: 3, Y: 5 })).to.eql('#');
    expect(mf.compile(msg2)({ X: 'x' })).to.eql('#');
  });

  it("obeys plural functions", function() {
    var mf = new MessageFormat({ fake: function(x) { return 'few'; } });
    expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:0})).to.be("res: wasfew");
    expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:1})).to.be("res: wasfew");
    expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:2})).to.be("res: wasfew");
    expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:3})).to.be("res: wasfew");
    expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({})).to.be("res: wasfew");
  });

  it("obeys selectordinal functions", function() {
    var mf = new MessageFormat({ fake: function(x, ord) { return ord ? 'few' : 'other'; } });
    expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:0})).to.be("res: wasfew");
    expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:1})).to.be("res: wasfew");
    expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:2})).to.be("res: wasfew");
    expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({val:3})).to.be("res: wasfew");
    expect((mf.compile("res: {val, selectordinal, few{wasfew} other{failed}}"))({})).to.be("res: wasfew");
  });

  it("throws an error when no `other` option is found - plurals", function() {
    var mf = new MessageFormat('en');
    expect(function(){ var x = mf.compile("{X, plural, someoption{a}}"); }).to.throwError();
  });

  it("throws an error when no `other` option is found - selects", function() {
    var mf = new MessageFormat('en');
    expect(function(){ var x = mf.compile("{X, select, someoption{a}}"); }).to.throwError();
  });

  it("throws an error when no `other` option is found - selectordinals", function() {
    var mf = new MessageFormat('en');
    expect(function(){ var x = mf.compile("{X, selectordinal, someoption{a}}"); }).to.throwError();
  });

  it("does not throw an error when no `other` option is found - plurals with custom pluralFunc", function() {
    var fake = function(x, ord) { return ord ? 'few' : 'some'; }
    fake.cardinal = ['some']
    fake.ordinal = ['few']
    var mf = new MessageFormat({ fake: fake });
    expect(function(){ var x = mf.compile("{X, plural, some{a}}"); }).to.not.throwError();
  });

  it("only calculates the offset from non-literals", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("{NUM, plural, offset:1 =0{a} one{b} other{c}}");
    expect(mfunc({NUM:0})).to.eql('a');
    expect(mfunc({NUM:1})).to.eql('c');
    expect(mfunc({NUM:2})).to.eql('b');
  });

  it("should obey `i=0 and v=0` rules", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("{NUM, plural, one{a} other{b}}");
    expect(mfunc({NUM:'1'})).to.eql('a');
    expect(mfunc({NUM:'1.0'})).to.eql('b');
  });

  it("should give priority to literals", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("{NUM, plural, =34{a} one{b} other{c}}");
    expect(mfunc({NUM:34})).to.eql('a');
  });

  it("should use the locale plural function", function() {
    var mf = new MessageFormat('cy');
    var mfunc = mf.compile("{num, plural, zero{0} one{1} two{2} few{3} many{6} other{+}}");
    expect(mfunc.toString()).to.match(/\bcy\b/);
    expect(mfunc({num: 5})).to.be("+");
  });

  it("should use the locale selectordinal function", function() {
    var mf = new MessageFormat('cy');
    var mfunc = mf.compile("{num, selectordinal, zero{0,7,8,9} one{1} two{2} few{3,4} many{5,6} other{+}}");
    expect(mfunc.toString()).to.match(/\bcy\b/);
    expect(mfunc({num: 5})).to.be("5,6");
  });

  it("should use the fallback locale plural function if the locale isn't available", function() {
    var mf = new MessageFormat('en-x-test1-test2');
    var mfunc = mf.compile("{num, plural, one {# thing} other {# things}}");
    expect(mfunc.toString()).to.match(/\ben[-_]/);
    expect(mfunc({num: 3})).to.be("3 things");
  });

  it("should throw an error when you don't pass it any data, but it expects it", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("{NEEDSDATAYO}");
    expect(function(){ var z = mfunc(); }).to.throwError();
  });

  it("should not throw an error when you don't pass it any data, but it expects none", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("Just a string");
    expect(function(){ var z = mfunc(); }).to.not.throwError();
  });

  it("should throw an error when using an undefined formatting function", function() {
    var mf = new MessageFormat('en');
    expect(function(){ mf.compile("This is {VAR,uppercase}.") }).to.throwError();
  });

  it("should use formatting functions - set in MessageFormat.formatters", function() {
    var mf = new MessageFormat('en').setIntlSupport();
    var mfunc = mf.compile("The date is {VAR,date}.");
    expect(mfunc({"VAR":"2010-12-31"})).to.contain("2010");
  });

  it("should use formatting functions - set by #addFormatters()", function() {
    var mf = new MessageFormat('en').addFormatters({ uppercase: function(v) { return v.toUpperCase(); } });
    var mfunc = mf.compile("This is {VAR,uppercase}.");
    expect(mfunc({"VAR":"big"})).to.eql("This is BIG.");
  });

  it("should use formatting functions for object input - set by #addFormatters()", function() {
    var mf = new MessageFormat('en').addFormatters({ uppercase: function(v) { return v.toUpperCase(); } });
    var mfunc = mf.compile(["This is {VAR,uppercase}.", "Other string"]);
    expect(mfunc[0]({"VAR":"big"})).to.eql("This is BIG.");
  });

  it("should be able to disable plural checks", function() {
    var mf0 = new MessageFormat('en');
    var mf1 = new MessageFormat('en');
    var msg = '{X, plural, zero{none} one{one} other{some: #}}';
    expect(function(){ mf0.compile(msg) }).to.throwError();
    mf0.disablePluralKeyChecks();
    expect(mf0.compile(msg)({ X: 0 })).to.eql("some: 0");
    expect(function(){ mf1.compile(msg) }).to.throwError();
  });

  it("should add control codes to bidirectional text", function() {
    var msg = '{0} >> {1}';
    var data = ['Hello! English', 'Hello \u0647\u0644\u0627\u060d'];
    var mfEn = new MessageFormat('en').setBiDiSupport(true);
    var mfEg = new MessageFormat('ar-EG').setBiDiSupport(true);
    expect(mfEn.compile(msg)(data)).to.equal('\u200eHello! English\u200e >> \u200eHello \u0647\u0644\u0627\u060d\u200e');
    expect(mfEg.compile(msg)(data)).to.equal('\u200fHello! English\u200f >> \u200fHello \u0647\u0644\u0627\u060d\u200f');
  });

  it("should allow for a simple select", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("I am {FEELING, select, a{happy} b{sad} other{indifferent}}.");
    expect(mfunc({FEELING:"a"})).to.eql("I am happy.");
    expect(mfunc({FEELING:"b"})).to.eql("I am sad.");
    expect(mfunc({FEELING:"q"})).to.eql("I am indifferent.");
    expect(mfunc({})).to.eql("I am indifferent.");
  });

  it("should allow for a simple plural form", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("I have {FRIENDS, plural, one{one friend} other{# friends}}.");
    expect(mfunc({FRIENDS:0})).to.eql("I have 0 friends.");
    expect(mfunc({FRIENDS:1})).to.eql("I have one friend.");
    expect(mfunc({FRIENDS:2})).to.eql("I have 2 friends.");
  });

  it("should allow for a simple selectordinal form", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("The {FLOOR, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} floor.");
    expect(mfunc({FLOOR:0})).to.eql("The 0th floor.");
    expect(mfunc({FLOOR:1})).to.eql("The 1st floor.");
    expect(mfunc({FLOOR:2})).to.eql("The 2nd floor.");
  });

  it("should reject number injections of numbers that don't exist", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile(
      "I have {FRIENDS, plural, one{one friend} other{# friends but {ENEMIES, plural, offset:1 " +
      "=0{no enemies} =1{one nemesis} one{two enemies} other{one nemesis and # enemies}}}}."
    );
    expect(mfunc({FRIENDS:0, ENEMIES: 0})).to.eql("I have 0 friends but no enemies.");
    expect(function(){ var x = mfunc({}); }).to.throwError(/\bENEMIES\b.*non-numerical value/);
    expect(function(){ var x = mfunc({FRIENDS:0}); }).to.throwError(/\bENEMIES\b.*non-numerical value/);
    expect(mfunc({ENEMIES:1})).to.eql('I have undefined friends but one nemesis.');
  });

  it("should not expose prototype members - selects", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("I am {FEELING, select, a{happy} hasOwnProperty{evil} other{indifferent}}.");
    expect(mfunc({FEELING:"toString"})).to.eql("I am indifferent.");
  });

  it("should not expose prototype members - plurals", function() {
    var mf = new MessageFormat('en');
    var mfunc = mf.compile("I have {FRIENDS, plural, one{one friend} other{friends}}.");
    expect(mfunc({FRIENDS:"toString"})).to.eql("I have friends.");
  });

});
describe("Real World Uses", function() {

  it("can correctly pull in a different pluralization rule set", function() {
    // note, cy.js was included in the html file for the browser
    // and then in the common.js file
    var mf = new MessageFormat('cy');
    var mfunc = mf.compile("{NUM, plural, zero{a} one{b} two{c} few{d} many{e} other{f} =42{omg42}}");
    expect(mfunc({NUM:0})).to.eql('a');
    expect(mfunc({NUM:1})).to.eql('b');
    expect(mfunc({NUM:2})).to.eql('c');
    expect(mfunc({NUM:3})).to.eql('d');
    expect(mfunc({NUM:6})).to.eql('e');
    expect(mfunc({NUM:15})).to.eql('f');
    expect(mfunc({NUM:42})).to.eql('omg42');
  });

  it("can parse complex, real-world messages with nested selects and plurals with offsets", function() {
    var input = "" +
    "{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1" +
    "     =0 {no one}"+
    "     =1 {just {GENDER, select, male {him} female {her} other{them}}self}"+
    "    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}"+
    "  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}"+
    "} to {GENDER, select,"+
    "   male {his}"+
    " female {her}"+
    "  other {their}"+
    "} group.";

    var mf = new MessageFormat('en');
    var mf_func = mf.compile(input);

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 0,
        PERSON : "Allie Sexton",
        GENDER: "female"
    })).to.eql('Allie Sexton added no one to her group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 1,
        PERSON : "Allie Sexton",
        GENDER: "female"
    })).to.eql('Allie Sexton added just herself to her group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 2,
        PERSON : "Allie Sexton",
        GENDER: "female"
    })).to.eql('Allie Sexton added herself and one other person to her group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 3,
        PERSON : "Allie Sexton",
        GENDER: "female"
    })).to.eql('Allie Sexton added herself and 2 other people to her group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 0,
        PERSON : "Alex Sexton",
        GENDER: "male"
    })).to.eql('Alex Sexton added no one to his group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 1,
        PERSON : "Alex Sexton",
        GENDER: "male"
    })).to.eql('Alex Sexton added just himself to his group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 2,
        PERSON : "Alex Sexton",
        GENDER: "male"
    })).to.eql('Alex Sexton added himself and one other person to his group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 3,
        PERSON : "Alex Sexton",
        GENDER: "male"
    })).to.eql('Alex Sexton added himself and 2 other people to his group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 0,
        PERSON : "Al Sexton"
    })).to.eql('Al Sexton added no one to their group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 1,
        PERSON : "Al Sexton"
    })).to.eql('Al Sexton added just themself to their group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 2,
        PERSON : "Al Sexton"
    })).to.eql('Al Sexton added themself and one other person to their group.');

    expect(mf_func({
        PLURAL_NUM_PEOPLE : 3,
        PERSON : "Al Sexton"
    })).to.eql('Al Sexton added themself and 2 other people to their group.');
  });

  it("can compile an object of messages into a function", function() {
    var mf = new MessageFormat('en');
    var data = { 'key': 'I have {FRIENDS, plural, one{one friend} other{# friends}}.' };
    var mfunc = mf.compile(data);
    expect(mfunc).to.be.an('object');
    expect(mfunc.toString()).to.match(/\bkey\b/);

    expect(mfunc.key).to.be.a('function');
    expect(mfunc.key({FRIENDS:1})).to.eql("I have one friend.");
    expect(mfunc.key({FRIENDS:2})).to.eql("I have 2 friends.");
  });

  it("can compile an object enclosing reserved JavaScript words used as keys in quotes", function() {
    var mf = new MessageFormat('en');
    var data = { 'default': 'default is a JavaScript reserved word so should be quoted',
                 'unreserved': 'unreserved is not a JavaScript reserved word so should not be quoted' };
    var mfunc = mf.compile(data);
    expect(mfunc.toString()).to.match(/"default"/);
    expect(mfunc.toString()).to.match(/[^"]unreserved[^"]/);

    expect(mfunc['default']).to.be.a('function');
    expect(mfunc['default']()).to.eql("default is a JavaScript reserved word so should be quoted");

    expect(mfunc.unreserved).to.be.a('function');
    expect(mfunc.unreserved()).to.eql("unreserved is not a JavaScript reserved word so should not be quoted");
  });

  it("can be instantiated multiple times for multiple languages", function() {
    var mf = {
        en: new MessageFormat('en'),
        ru: new MessageFormat('ru')
    };
    var cf = {
        en: mf.en.compile('{count} {count, plural, other{users}}'),
        ru: mf.ru.compile('{count} {count, plural, other{пользователей}}')
    };
    expect(function(){ cf.en({count: 12}); }).to.not.throwError();
    expect(cf.en({count: 12})).to.eql('12 users');
    expect(function(){ cf.ru({count: 13}); }).to.not.throwError();
    expect(cf.ru({count: 13})).to.eql('13 пользователей');
  });

  it("can support multiple languages internally", function() {
    var mf = new MessageFormat([ 'en', 'ru' ]);
    var cf = mf.compile({
        en: '{count} {count, plural, other{users}}',
        ru: '{count} {count, plural, other{пользователей}}'
    });
    expect(function(){ cf.en({count: 12}); }).to.not.throwError();
    expect(cf.en({count: 12})).to.eql('12 users');
    expect(function(){ cf.ru({count: 13}); }).to.not.throwError();
    expect(cf.ru({count: 13})).to.eql('13 пользователей');
  });

});
describe("Module/CommonJS support", function() {
  var colorSrc = { red: 'red', blue: 'blue', green: 'green' };
  var cf = new MessageFormat('en').compile(colorSrc);

  if (typeof require !== 'undefined') {
    ['module.exports', 'exports', 'global.i18n', 'umd'].forEach(function(moduleFmt) {
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
              expect(colors.red).to.be(undefined);
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
      expect(window).to.have.property('i18n')
      var colors = window.i18n;
      expect(colors.red()).to.eql('red');
      expect(colors.blue()).to.eql('blue');
      expect(colors.green()).to.eql('green');
    });
  }
});
