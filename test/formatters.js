if (typeof require !== 'undefined') {
  var expect = require('chai').expect;
  var MessageFormat = require('../packages/messageformat');
}

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
      // IE 11 inserts a non-breaking space before the % char
      expect(msg(data)).to.be.oneOf(['99% complete', '99\xa0% complete']);
    });

    it('default currency', function() {
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is $5.50.');
    });

    it('currency', function() {
      mf.currency = 'EUR';
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is €5.50.');
    });

    it('currency:GBP', function() {
      mf.currency = 'EUR';
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

    it('should use formatting functions - set in MessageFormat.formatters', function() {
      let msg = mf.compile('The date is {VAR,date}.');
      expect(msg({ VAR: '2010-12-31' })).to.contain('2010');
      msg = mf.compile('Countdown: {VAR, duration}.');
      expect(msg({ VAR: -151200.42 })).to.eql('Countdown: -42:00:00.420.');
    });

    it('should use formatting functions - set by #addFormatters()', function() {
      mf.addFormatters({
        uppercase: function(v) {
          return v.toUpperCase();
        }
      });
      const msg = mf.compile('This is {VAR,uppercase}.');
      expect(msg({ VAR: 'big' })).to.eql('This is BIG.');
    });

    it('should use formatting functions for object input - set by #addFormatters()', function() {
      mf.addFormatters({
        uppercase: function(v) {
          return v.toUpperCase();
        }
      });
      const msg = mf.compile(['This is {VAR,uppercase}.', 'Other string']);
      expect(msg[0]({ VAR: 'big' })).to.eql('This is BIG.');
    });

    describe('arguments', function() {
      beforeEach(function() {
        mf = new MessageFormat('en');
        mf.addFormatters({
          arg: function(v, lc, arg) {
            return arg;
          }
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
