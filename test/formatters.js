const expect = require('chai').expect;
const MessageFormat = require('../packages/messageformat');

const NODE_VERSION =
  typeof process === 'undefined' ? 99 : parseInt(process.version.slice(1));

// MS Edge adds LTR/RTL marks around Date#toLocale*String parts
function dropBiDi(str) {
  return str.replace(/[\u200e\u200f]/g, '');
}

describe('Formatters', function() {
  describe('date', function() {
    let mf;
    beforeEach(function() {
      mf = new MessageFormat(['en', 'fi']);
    });

    it('default', function() {
      const msg = mf.compile('Today is {T, date}');
      const data = { T: new Date(2016, 1, 21) };
      expect(dropBiDi(msg(data))).to.eql('Today is Feb 21, 2016');
    });

    it('set locale', function() {
      const msg = mf.compile('Tänään on {T, date}', 'fi');
      const data = { T: new Date(2016, 1, 21) };
      expect(dropBiDi(msg(data))).to.match(/^Tänään on .*2016/);
    });

    it('argument', function() {
      const msg = mf.compile('Unix time started on {T, date, full}');
      const data = { T: 0 };
      expect(dropBiDi(msg(data))).to.be.oneOf([
        'Unix time started on Wednesday, December 31, 1969',
        'Unix time started on Thursday, January 1, 1970',
        'Unix time started on Thursday, January 01, 1970' // IE 11
      ]);
    });

    it('complex', function() {
      const msg = mf.compile('{sys} became operational on {d0, date, short}');
      const data = { sys: 'HAL 9000', d0: new Date(1999, 0, 12) };
      expect(dropBiDi(msg(data))).to.eql(
        'HAL 9000 became operational on 1/12/1999'
      );
    });
  });

  describe('duration', function() {
    let mf;
    beforeEach(function() {
      mf = new MessageFormat();
    });

    it('default', function() {
      const msg = mf.compile('It has been {D, duration}');
      const data = { D: 123 };
      expect(msg(data)).to.eql('It has been 2:03');
    });

    it('complex', function() {
      const msg = mf.compile('Countdown: {D, duration}');
      const data = { D: -151200.42 };
      expect(msg(data)).to.eql('Countdown: -42:00:00.420');
    });
  });

  describe('number', function() {
    let mf;
    beforeEach(function() {
      mf = new MessageFormat('en');
    });

    it('integer', function() {
      const msg = mf.compile('{N} is almost {N, number, integer}');
      const data = { N: 3.14 };
      expect(msg(data)).to.eql('3.14 is almost 3');
    });

    it('percent', function() {
      const msg = mf.compile('{P, number, percent} complete');
      const data = { P: 0.99 };
      // IE 11 may insert a space or non-breaking space before the % char
      expect(msg(data)).to.be.oneOf([
        '99% complete',
        '99 % complete',
        '99\xa0% complete'
      ]);
    });

    it('default currency', function() {
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is $5.50.');
    });

    it('currency', function() {
      mf = new MessageFormat('en', { currency: 'EUR' });
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is €5.50.');
    });

    it('currency:GBP', function() {
      mf = new MessageFormat('en', { currency: 'EUR' });
      const msg = mf.compile('The total is {V, number, currency:GBP}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is £5.50.');
    });
  });

  describe('time', function() {
    let mf;
    beforeEach(function() {
      mf = new MessageFormat(['en', 'fi']);
    });

    it('default', function() {
      const msg = mf.compile('The time is now {T, time}');
      const data = { T: 978384385000 };
      expect(dropBiDi(msg(data))).to.match(
        /^The time is now \d\d?:\d\d:25 PM$/
      );
    });

    it('set locale', function() {
      const msg = mf.compile('Kello on nyt {T, time}', 'fi');
      const data = { T: 978384385000 };
      expect(dropBiDi(msg(data))).to.match(/^Kello on nyt \d\d?.\d\d.25/);
    });

    it('full time & date', function() {
      const msg = mf.compile(
        'The Eagle landed at {T, time, full} on {T, date, full}'
      );
      const time = new Date(1969, 6, 20, 20, 17, 40);
      time.setMinutes(time.getMinutes() + time.getTimezoneOffset());
      const data = { T: time };
      expect(dropBiDi(msg(data))).to.match(
        /^The Eagle landed at \d\d?:\d\d:40 [AP]M( \S+)? on \w+day, July \d\d, 1969$/
      );
    });
  });

  describe('Date skeletons', () => {
    const isIE11 =
      typeof window !== 'undefined' &&
      !!window.MSInputMethodContext &&
      !!document.documentMode;
    const testDate = isIE11 ? it.skip : it;

    // 2006 Jan 2, 15:04:05.789 in local time
    const date = new Date(2006, 0, 2, 15, 4, 5, 789);

    const cases = {
      GGGGyMMMM: { exp: 'January 2006 Anno Domini' },
      GGGGGyyMMMMM: { exp: 'J 06 A' },
      GrMMMdd: { exp: 'Jan 02, 2006 AD' },
      GMMd: { exp: '01/2 AD' },
      hamszzzz: { exp: /^3:0?4:0?5 PM [A-Z]/ }
    };
    if (NODE_VERSION >= 12)
      Object.assign(cases, {
        Mk: { exp: '1, 15' } // Node 8 says '3 PM' for k
      });

    const mf = new MessageFormat('en');
    for (const [src, { exp }] of Object.entries(cases)) {
      testDate(src, () => {
        const msg = mf.compile(`{date, date, ::${src}}`);
        const res = msg({ date });
        if (typeof exp === 'string') expect(res).to.equal(exp);
        else expect(res).to.match(exp);
      });
    }
  });

  describe('Number patterns', () => {
    const cases = {
      '#,##0.##': { value: 1234.567, lc: 'fr', exp: '1 234,57' },
      '#,##0.###': { value: 1234.567, lc: 'fr', exp: '1 234,567' },
      '###0.#####': { value: 1234.567, lc: 'fr', exp: '1234,567' },
      '###0.0000#': { value: 1234.567, lc: 'fr', exp: '1234,5670' },
      '00000.0000': { value: 1234.567, lc: 'fr', exp: '01234,5670' },
      '#,##0.00 ¤': {
        value: 1234.567,
        lc: 'fr',
        cur: 'EUR',
        exp: '1 234,57 €'
      },
      "'#'#": { value: 123, lc: 'en', exp: '#123' },
      //"# o''clock": { value: 12, lc: 'en', exp: "12 o'clock" },
      '@@': { value: 12345, lc: 'en', exp: '12,000' },
      '@@@': { value: 0.12345, lc: 'en', exp: '0.123' },
      '@@##': { value: 3.14159, lc: 'en', exp: '3.142' },
      '@@###': { value: 1.23004, lc: 'en', exp: '1.23' },
      '@##': { value: 0.1203, lc: 'en', exp: '0.12' },
      '#,#@#': { value: 1234, lc: 'en', exp: '1,200' },
      '#,#50': { value: 1230, lc: 'en', exp: '1,250' },
      '#,##0.65': { value: 1.234, lc: 'en', exp: '1.3' }
    };

    if (NODE_VERSION >= 12)
      Object.assign(cases, {
        '¤': { value: 12, lc: 'en', cur: 'CAD', exp: 'CA$12.00' },
        '¤¤': { value: 12, lc: 'en', cur: 'CAD', exp: 'CAD 12.00' },
        '¤¤¤': { value: 5, lc: 'en', cur: 'CAD', exp: '5.00 Canadian dollars' },
        '¤¤¤¤¤': { value: 12, lc: 'en', cur: 'CAD', exp: '$12.00' },
        '¤#,##0.00;(¤#,##0.00)': {
          value: -3.27,
          lc: 'en',
          cur: 'USD',
          exp: '($3.27)'
        },
        '0.###E0': { value: 1234, lc: 'en', exp: '1.234E3' },
        '00.###E0': { value: 0.00123, lc: 'en', exp: '01.23E-3' },
        '##0.####E0': { value: 12345, lc: 'en', exp: '12.345E3' }
      });

    for (const [src, { value, lc, cur, exp }] of Object.entries(cases)) {
      it(src, () => {
        const mf = new MessageFormat(lc, cur ? { currency: cur } : null);
        const msg = mf.compile(`{value, number, ${src}}`);
        expect(msg({ value }).replace(/\s/g, ' ')).to.equal(exp);
      });
    }
  });

  describe('Number skeletons', () => {
    const cases = [
      ['.00', 42, '42.00'],
      ['scale/100', 42, '4,200'],
      ['compact-short', 42, '42'],
      ['compact-long', 42, '42'],
      ['group-min2', 42, '42', [{}]]
    ];

    if (NODE_VERSION >= 12)
      cases.push(
        ['measure-unit/length-meter', 42, '42 m'],
        ['measure-unit/length-meter unit-width-full-name', 42, '42 meters'],
        ['currency/CAD', 42, 'CA$42.00'],
        ['currency/CAD unit-width-narrow', 42, '$42.00'],
        ['compact-short currency/CAD', 42, 'CA$42'],
        ['sign-always', 42, '+42'],
        ['sign-except-zero', 42, '+42'],
        ['sign-accounting currency/CAD', -42, '(CA$42.00)']
      );

    for (const [src, value, expected] of cases) {
      it(src, () => {
        const mf = new MessageFormat('en');
        const msg = mf.compile(`{value, number, :: ${src}}`);
        expect(msg({ value })).to.equal(expected);
      });
    }

    it('percent .00', () => {
      const mf = new MessageFormat('en');
      const msg = mf.compile(`{value, number, :: percent .00}`);
      const res = msg({ value: 42 })
        .replace(/\u2004/g, '') // IE 11
        .replace(/\s%/, '%'); // IE 11
      expect(res).to.equal('42.00%');
    });

    it('foo (error)', () => {
      const mf = new MessageFormat('en');
      expect(() => mf.compile('{value, number, :: foo}')).to.throw(
        'Unknown stem: foo'
      );
    });

    it('.00/@@/@@ (error)', () => {
      const mf = new MessageFormat('en');
      expect(() => mf.compile('{value, number, :: .00/@@/@@}')).to.throw(
        'Token .00 only supports one option (got 2)'
      );
    });
  });

  describe('Custom formatters', function() {
    let mf;
    beforeEach(function() {
      mf = new MessageFormat('en');
    });

    it('should throw an error when using an undefined formatting function', function() {
      expect(function() {
        mf.compile('This is {VAR,uppercase}.');
      }).to.throw();
    });

    it('should use default formatting functions', function() {
      let msg = mf.compile('The date is {VAR,date}.');
      expect(msg({ VAR: '2010-12-31' })).to.contain('2010');
      msg = mf.compile('Countdown: {VAR, duration}.');
      expect(msg({ VAR: -151200.42 })).to.eql('Countdown: -42:00:00.420.');
    });

    it('should use formatting functions - set by customFormatters option', function() {
      mf = new MessageFormat('en', {
        customFormatters: { uppercase: v => v.toUpperCase() }
      });
      const msg = mf.compile('This is {VAR,uppercase}.');
      expect(msg({ VAR: 'big' })).to.eql('This is BIG.');
    });

    describe('arguments', function() {
      beforeEach(function() {
        mf = new MessageFormat('en', {
          customFormatters: { arg: (v, lc, arg) => arg }
        });
      });

      it('basic string', function() {
        const msg = mf.compile('This is {_, arg, X, Y }.');
        expect(msg({})).to.eql('This is X, Y.');
      });

      it('select', function() {
        const msg = mf.compile(
          'This is {_, arg, {VAR, select, x{X} other{Y}}}.'
        );
        expect(msg({ VAR: 'x' })).to.eql('This is X.');
      });

      it('# in plural', function() {
        const msg = mf.compile(
          'This is {VAR, plural, one{} other{{_, arg, #}}}.'
        );
        expect(msg({ VAR: 99 })).to.eql('This is 99.');
      });
    });
  });
});
