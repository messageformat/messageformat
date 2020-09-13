import { expect } from 'chai';
import MessageFormat from 'messageformat';
import { PluralFunction } from 'messageformat/src/plurals';
import { getTestCases } from '../fixtures/messageformat';

// @ts-ignore
const isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
const isEdge = !isIE11 && !!window.StyleMedia;
const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

describe('static MessageFormat', () => {
  it('should exist', () => {
    expect(MessageFormat).to.be.an.instanceof(Function);
  });

  it('should have a supportedLocalesOf() function', () => {
    expect(MessageFormat.supportedLocalesOf).to.be.an.instanceof(Function);
  });

  it('should have a working supportedLocalesOf() function', () => {
    const lc = MessageFormat.supportedLocalesOf(['fi', 'xx', 'en-CA']);
    expect(lc).to.eql(['fi', 'en-CA']);
  });
});

describe('new MessageFormat()', () => {
  it('should be a constructor', () => {
    const mf = new MessageFormat('en');
    expect(mf).to.be.an.instanceof(MessageFormat);
  });

  it('should have a compile() function', () => {
    const mf = new MessageFormat('en');
    expect(mf.compile).to.be.an.instanceof(Function);
  });

  it('should have a resolvedOptions() function', () => {
    const mf = new MessageFormat('en');
    expect(mf.resolvedOptions).to.be.an.instanceof(Function);
  });

  it('should fallback when a base pluralFunc exists', () => {
    const mf = new MessageFormat('en-x-test1-test2');
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('en-x-test1-test2');
    expect(opt.plurals[0].getPlural).to.be.an.instanceof(Function);
  });

  it('should fallback when a base pluralFunc exists (underscores)', () => {
    const mf = new MessageFormat('en_x_test1_test2');
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('en_x_test1_test2');
    expect(opt.plurals[0].getPlural).to.be.an.instanceof(Function);
  });

  it('should fallback on non-existing locales', () => {
    const mf = new MessageFormat('lawlz');
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('en');
  });

  it('should default to `en` when no locale is passed into the constructor', () => {
    const mf = new MessageFormat('lawlz');
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('en');
  });

  it('should accept custom plural functions', () => {
    const fake: PluralFunction = function fake(_, ord) {
      return ord ? 'few' : 'many';
    };
    fake.cardinals = ['many'];
    fake.ordinals = ['few'];
    const mf = new MessageFormat([fake]);
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('fake');
    expect(opt.plurals[0].getPlural).to.equal(fake);
    expect(opt.plurals[0].cardinals).to.equal(fake.cardinals);
    expect(opt.plurals[0].ordinals).to.equal(fake.ordinals);
    expect(() => mf.compile('{X, plural, many{a}}')).not.to.throw();
  });

  it('should include all locales for "*"', () => {
    const mf = new MessageFormat('*');
    const opt = mf.resolvedOptions();
    expect(opt.locale).to.equal('en');
    expect(opt.plurals.length).to.be.above(100);
  });
});

describe('compile() errors', () => {
  it('Missing other in select', () => {
    const mf = new MessageFormat('en');
    const src = '{X, select, foo{a}}';
    expect(() => mf.compile(src)).to.throw(/No 'other' form found/);
  });

  it('Missing other in plural', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, one{a}}';
    expect(() => mf.compile(src)).to.throw(/No 'other' form found/);
  });

  it('Invalid plural key', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, foo{a}}';
    expect(() => mf.compile(src)).to.throw(
      'The plural case foo is not valid in this locale'
    );
  });

  it('Invalid selectordinal key', () => {
    const mf = new MessageFormat('en');
    const src = '{X, selectordinal, foo{a}}';
    expect(() => mf.compile(src)).to.throw(
      'The selectordinal case foo is not valid in this locale'
    );
  });

  it('Invalid plural key for locale', () => {
    const mf = new MessageFormat('en');
    const src = '{X, plural, zero{none} one{one} other{some: #}}';
    expect(() => mf.compile(src)).to.throw(
      'The plural case zero is not valid in this locale'
    );
  });

  it('Undefined formatting function', () => {
    const mf = new MessageFormat('en');
    const src = 'This is {VAR,uppercase}.';
    expect(() => mf.compile(src)).to.throw();
  });

  it('Unknown number skeleton stem', () => {
    const mf = new MessageFormat('en');
    const src = '{value, number, :: foo}';
    expect(() => mf.compile(src)).to.throw('Unknown stem: foo');
  });

  it('Number skeleton .00/@@/@@', () => {
    const mf = new MessageFormat('en');
    const src = '{value, number, :: .00/@@/@@}';
    expect(() => mf.compile(src)).to.throw(
      'Token .00 only supports one option (got 2)'
    );
  });
});

for (const [title, cases] of Object.entries(getTestCases(MessageFormat))) {
  describe(title, () => {
    for (const { locale, options, src, exp, skip } of cases) {
      if (skip) {
        if (isIE11 && skip.includes('ie')) continue;
        if (isEdge && skip.includes('edge')) continue;
        if (isFirefox && skip.includes('ff')) continue;
      }
      let name = src;
      if (locale || options) {
        const opt = [locale || 'en'];
        for (const [key, value] of Object.entries(options || {}))
          opt.push(`${key}: ${value}`);
        name = `[${opt.join(', ')}] ${src}`;
      }
      describe(name, () => {
        for (const [param, res] of exp) {
          const strParam = [];
          if (param && typeof param === 'object')
            for (const [key, value] of Object.entries(param))
              strParam.push(`${key}: ${value}`);
          else strParam.push(String(param));
          it(strParam.join(', '), () => {
            const mf = new MessageFormat(locale || 'en', options);
            const msg = mf.compile(src);
            if (res && typeof res === 'object' && 'error' in res) {
              if (res.error === true) expect(() => msg(param)).to.throw();
              else expect(() => msg(param)).to.throw(res.error);
            } else if (res instanceof RegExp) {
              expect(msg(param)).to.match(res);
            } else if (Array.isArray(res)) {
              expect(msg(param)).to.eql(res);
            } else {
              expect(msg(param)).to.equal(res);
            }
          });
        }
      });
    }
  });
}
