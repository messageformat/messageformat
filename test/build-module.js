if (typeof require === 'undefined') return;

const babel = require('@babel/core');
const expect = require('chai').expect;
const fs = require('fs');
const tmp = require('tmp-promise');
const { promisify } = require('util');
const MessageFormat = require('../packages/messageformat');
const compileModule = require('../packages/messageformat/compile-module');

module.exports = { getModule };

const write = promisify(fs.write);
async function getModule(mf, messages) {
  const src = compileModule(mf, messages);
  const options = { plugins: ['@babel/plugin-transform-modules-commonjs'] };
  const { code } = await babel.transformAsync(src, options);
  const { cleanup, fd, path } = await tmp.file({
    dir: __dirname,
    postfix: '.js'
  });
  await write(fd, code, 0, 'utf8');
  try {
    return require(path).default;
  } finally {
    cleanup();
  }
}

describe('compileModule()', function() {
  it('can compile an object of messages', async function() {
    const data = {
      key: 'I have {FRIENDS, plural, one{one friend} other{# friends}}.'
    };
    const mf = new MessageFormat('en');
    const mfunc = await getModule(mf, data);
    expect(mfunc).to.be.an('object');
    expect(mfunc.key).to.be.a('function');
    expect(mfunc.key({ FRIENDS: 1 })).to.eql('I have one friend.');
    expect(mfunc.key({ FRIENDS: 2 })).to.eql('I have 2 friends.');
  });

  it('can compile an object enclosing reserved JavaScript words used as keys in quotes', async function() {
    const data = {
      default: 'default is a JavaScript reserved word so should be quoted',
      unreserved:
        'unreserved is not a JavaScript reserved word so should not be quoted'
    };
    const mf = new MessageFormat('en');
    const mfunc = await getModule(mf, data);

    expect(mfunc['default']).to.be.a('function');
    expect(mfunc['default']()).to.eql(
      'default is a JavaScript reserved word so should be quoted'
    );

    expect(mfunc.unreserved).to.be.a('function');
    expect(mfunc.unreserved()).to.eql(
      'unreserved is not a JavaScript reserved word so should not be quoted'
    );
  });

  it('can be instantiated multiple times for multiple languages', async function() {
    const mf = {
      en: new MessageFormat('en'),
      ru: new MessageFormat('ru')
    };
    const cf = {
      en: await getModule(mf.en, '{count} {count, plural, other{users}}'),
      ru: await getModule(
        mf.ru,
        '{count} {count, plural, other{пользователей}}'
      )
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

  it('can support multiple languages', async function() {
    const mf = new MessageFormat(['en', 'fr', 'ru'], { customFormatters });
    const cf = await getModule(mf, {
      fr: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('defaults to supporting only English', async function() {
    const mf = new MessageFormat(null, { customFormatters });
    const cf = await getModule(mf, {
      xx: 'Locale: {_, lc}',
      fr: 'Locale: {_, lc}'
    });
    expect(cf.xx({})).to.eql('Locale: en');
    expect(cf.fr({})).to.eql('Locale: en');
  });

  it('supports all languages with locale "*"', async function() {
    const mf = new MessageFormat('*', { customFormatters });
    const cf = await getModule(mf, {
      fr: 'Locale: {_, lc}',
      xx: 'Locale: {_, lc}',
      ru: '{count, plural, one{1} few{2} many{3} other{x:#}}'
    });
    expect(cf.fr({})).to.eql('Locale: fr');
    expect(cf.xx({})).to.eql('Locale: en');
    expect(cf.ru({ count: 12 })).to.eql('3');
  });

  it('should support custom formatter functions', async function() {
    const mf = new MessageFormat('en', {
      customFormatters: { uppercase: v => v.toUpperCase() }
    });
    const msg = await getModule(mf, [
      'This is {VAR,uppercase}.',
      'Other string'
    ]);
    expect(msg[0]({ VAR: 'big' })).to.eql('This is BIG.');
  });

  it('should import cardinal-only plural by default', async () => {
    const mf = new MessageFormat('en');
    const msg = '{foo, plural, one{one} other{other}}';
    const src = compileModule(mf, { msg });
    expect(src).to.match(
      /import { en } from 'messageformat-runtime\/lib\/cardinals'/
    );
  });

  it('should import combined plural if required', async () => {
    const mf = new MessageFormat('en');
    const msg = '{foo, selectordinal, one{one} other{other}}';
    const src = compileModule(mf, { msg });
    expect(src).to.match(
      /import { en } from 'messageformat-runtime\/lib\/plurals'/
    );
  });

  it('should inline custom plural by default', async () => {
    function lc() {
      return 'other';
    }
    const mf = new MessageFormat(lc);
    const msg = '{foo, plural, one{one} other{other}}';
    const src = compileModule(mf, { msg });
    expect(src).to.match(/\nfunction lc\b/);
  });

  it('should import custom plural if defined with module', async () => {
    function lc() {
      return 'other';
    }
    lc.module = 'custom-module';
    const mf = new MessageFormat(lc);
    const msg = '{foo, plural, one{one} other{other}}';
    const src = compileModule(mf, { msg });
    expect(src).to.match(/import { lc } from 'custom-module'/);
  });
});
