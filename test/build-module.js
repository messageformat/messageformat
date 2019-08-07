if (typeof require !== 'undefined') {
  var expect = require('chai').expect;
  var MessageFormat = require('../packages/messageformat');
}

describe('compileModule()', function() {
  it('can compile an object of messages into a function', function() {
    const data = {
      key: 'I have {FRIENDS, plural, one{one friend} other{# friends}}.'
    };
    const mf = new MessageFormat('en');
    const mfunc = mf.compileModule(data);
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
    const mf = new MessageFormat('en');
    const mfunc = mf.compileModule(data);
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
      en: mf.en.compileModule('{count} {count, plural, other{users}}'),
      ru: mf.ru.compileModule('{count} {count, plural, other{пользователей}}')
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

  const customFormatters = { lc: (v, lc) => lc };

  it('can support multiple languages', function() {
    const mf = new MessageFormat(['en', 'fr', 'ru'], { customFormatters });
    const cf = mf.compileModule({
      fr: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('defaults to supporting only English', function() {
    const mf = new MessageFormat(null, { customFormatters });
    const cf = mf.compileModule({
      xx: 'Locale: {_, lc}',
      fr: 'Locale: {_, lc}'
    });
    expect(cf.xx({})).to.eql('Locale: en');
    expect(cf.fr({})).to.eql('Locale: en');
  });

  it('supports all languages with locale "*"', function() {
    const mf = new MessageFormat('*', { customFormatters });
    const cf = mf.compileModule({
      fr: 'Locale: {_, lc}',
      xx: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.xx({})).to.eql('Locale: en');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('should support custom formatter functions', function() {
    const mf = new MessageFormat('en', {
      customFormatters: { uppercase: v => v.toUpperCase() }
    });
    const msg = mf.compileModule(['This is {VAR,uppercase}.', 'Other string']);
    expect(msg[0]({ VAR: 'big' })).to.eql('This is BIG.');
  });

  describe('Module/CommonJS support', function() {
    var colorSrc = { red: 'red', blue: 'blue', green: 'green' };
    var cf = new MessageFormat('en').compileModule(colorSrc);

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
});
