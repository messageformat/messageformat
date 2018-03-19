if (typeof require !== 'undefined') {
  var expect = require('expect.js');
  var MessageFormat = require('../');
}

describe('Formatters', () => {
  describe('date', () => {
    let mf;
    beforeEach(() => {
      mf = new MessageFormat(['en', 'fi']);
    });

    it('default', () => {
      const msg = mf.compile('Today is {T, date}');
      const data = { T: Date.parse('2016-02-21') };
      expect(msg(data)).to.eql('Today is Feb 21, 2016');
    });

    it('set locale', () => {
      const msg = mf.compile('Tänään on {T, date}', 'fi');
      const data = { T: Date.parse('2016-02-21') };
      expect(msg(data)).to.match(/^Tänään on 21. helmik.* 2016$/);
    });

    it('argument', () => {
      const msg = mf.compile('Unix time started on {T, date, full}');
      const data = { T: 0 };
      expect(msg(data)).to.eql('Unix time started on Thursday, January 1, 1970');
    });

    it('complex', () => {
      const msg = mf.compile('{sys} became operational on {d0, date, short}');
      const data = { sys: 'HAL 9000', d0: '12 January 1999' };
      expect(msg(data)).to.eql('HAL 9000 became operational on 1/12/1999');
    });
  });

  describe('duration', () => {
    let mf;
    beforeEach(() => {
      mf = new MessageFormat();
    });

    it('default', () => {
      const msg = mf.compile('It has been {D, duration}');
      const data = { D: 123 };
      expect(msg(data)).to.eql('It has been 2:03');
    });

    it('complex', () => {
      const msg = mf.compile('Countdown: {D, duration}');
      const data = { D: -151200.42 };
      expect(msg(data)).to.eql('Countdown: -42:00:00.420');
    });
  });

  describe('number', () => {
    let mf;
    beforeEach(() => {
      mf = new MessageFormat('en');
    });

    it('integer', () => {
      const msg = mf.compile('{N} is almost {N, number, integer}');
      const data = { N: 3.14 };
      expect(msg(data)).to.eql('3.14 is almost 3');
    });

    it('percent', () => {
      const msg = mf.compile('{P, number, percent} complete');
      const data = { P: 0.99 };
      expect(msg(data)).to.eql('99% complete');
    });

    it('default currency', () => {
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is $5.50.');
    });

    it('currency', () => {
      mf.currency = 'EUR';
      const msg = mf.compile('The total is {V, number, currency}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is €5.50.');
    });

    it('currency:GBP', () => {
      mf.currency = 'EUR';
      const msg = mf.compile('The total is {V, number, currency:GBP}.');
      const data = { V: 5.5 };
      expect(msg(data)).to.eql('The total is £5.50.');
    });
  });

  describe('date', () => {
    let mf;
    beforeEach(() => {
      mf = new MessageFormat(['en', 'fi']);
    });

    it('default', () => {
      const msg = mf.compile('The time is now {T, time}');
      const data = { T: 978384385000 };
      expect(msg(data)).to.eql('The time is now 11:26:25 PM');
    });

    it('set locale', () => {
      const msg = mf.compile('Kello on nyt {T, time}', 'fi');
      const data = { T: 978384385000 };
      expect(msg(data)).to.eql('Kello on nyt 23.26.25');
    });

    it('full time & date', () => {
      const msg = mf.compile('The Eagle landed at {T, time, full} on {T, date, full}');
      const data = { T: '1969-07-20 20:17:40 UTC' };
      expect(msg(data)).to.eql('The Eagle landed at 10:17:40 PM GMT+2 on Sunday, July 20, 1969');
    });
  });
});

