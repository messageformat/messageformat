import { getDateFormatter, getDateFormatterSource } from './get-date-formatter';
import { parseDateTokens } from './tokens';

// Too many divergences in Intl.DateTimeFormat output on Node.js 10 and earlier
if (process.version < 'v12') test = test.skip;

// 2006 Jan 2, 15:04:05.789 in local time
const date = new Date(2006, 0, 2, 15, 4, 5, 789);

const tests: {
  [src: string]: { expected: string | string[] | RegExp; errors?: string[] };
} = {
  GGGGyMMMM: { expected: 'January 2006 Anno Domini' },
  GGGGGyyMMMMM: { expected: 'J 06 A' },
  GrMMMdd: { expected: 'Jan 02, 2006 AD' },
  GMMd: { expected: '01/2 AD' },
  "u..''LLLLLL'foo'''do": {
    expected: ['2 2006', '2006 (day: 2)'],
    errors: [
      'Extended year is not supported; falling back to year:numeric',
      'Ignoring string part: ..',
      "Ignoring string part: '",
      'Stand-alone month in year is not supported with width 6',
      "Ignoring string part: foo'",
      'The letter o is not a valid field identifier'
    ]
  },
  Mk: { expected: '1, 15' },
  DEHhX: {
    expected: 'Mon, 3 PM',
    errors: [
      'Day of year is not supported',
      'Duplicate hour token',
      'Time Zone: ISO8601 with Z is not supported'
    ]
  },
  ccHv: {
    expected: /^Mon, 15 [A-Z]/,
    errors: [
      'Numeric value is not supported for Stand-alone local day of week; falling back to weekday:short'
    ]
  },
  eeeeKVZ: {
    expected: /^Monday, 3 PM [A-Z]/,
    errors: [
      'Time Zone: ID is not supported with width 1',
      'Duplicate tz token'
    ]
  },
  hamszzzz: { expected: /^3:04:05 PM [A-Z]/ },
  sSVVVV: {
    expected: /^5 [A-Z]/,
    errors: ['Fractional second is not supported']
  },
  "qwdA'": {
    expected: '2',
    errors: [
      'Stand-alone quarter is not supported',
      'Week of year is not supported',
      'Milliseconds in day is not supported',
      "Unterminated quoted literal in pattern: qwdA'"
    ]
  }
};

const assertExpected = (res: string, exp: string | string[] | RegExp) =>
  Array.isArray(exp)
    ? expect(exp).toContain(res)
    : exp instanceof RegExp
    ? expect(res).toMatch(exp)
    : expect(res).toEqual(exp);

describe('Examples', () => {
  for (const [src, { expected, errors }] of Object.entries(tests)) {
    test(src, () => {
      // function from string
      let onError = jest.fn();
      let fmt = getDateFormatter('en', src, onError);
      assertExpected(fmt(date), expected);
      if (errors) {
        const messages = onError.mock.calls.map(args => args[0].message);
        expect(messages).toMatchObject(errors);
      } else expect(onError).not.toHaveBeenCalled();

      // function from tokens
      const tokens = parseDateTokens(src);
      onError = jest.fn();
      fmt = getDateFormatter('en', tokens, onError);
      assertExpected(fmt(date), expected);
      expect(onError).toHaveBeenCalledTimes(errors ? errors.length : 0);

      // source from string
      onError = jest.fn();
      let fmtSrc = getDateFormatterSource('en', src, onError);
      fmt = new Function(`return ${fmtSrc}`)();
      assertExpected(fmt(date), expected);
      expect(onError).toHaveBeenCalledTimes(errors ? errors.length : 0);

      // source from tokens
      onError = jest.fn();
      fmtSrc = getDateFormatterSource('en', tokens, onError);
      fmt = new Function(`return ${fmtSrc}`)();
      assertExpected(fmt(date), expected);
      expect(onError).toHaveBeenCalledTimes(errors ? errors.length : 0);
    });
  }
});

describe('Options', () => {
  test('hourCycle locale subtag', () => {
    const onError = jest.fn();
    const fmt = getDateFormatter('en-US-u-hc-h23', 'jms', onError);
    expect(fmt(date)).toEqual('15:04:05');
    expect(onError).not.toHaveBeenCalled();
  });

  test('calendar locale subtag', () => {
    const onError = jest.fn();
    const fmt = getDateFormatter('en-GB-u-ca-islamic', 'yMMMMd', onError);
    expect([
      '2 Dhuʻl-Hijjah 1426',
      'Dhuʻl-Hijjah 2, 1426',
      'Dhuʻl-Hijjah 2, 1426 AH',
      '2 Dhuʻl-Hijjah 1426 AH'
    ]).toContain(fmt(date));
    expect(onError).not.toHaveBeenCalled();
  });

  test('onError', () => {
    expect(() => getDateFormatter('en', '.')).toThrow(
      'Ignoring string part: .'
    );
  });
});

describe('Source output', () => {
  test('jms', () => {
    const fmtSrc = getDateFormatterSource('en', 'jms');
    expect(fmtSrc).toEqual(
      `(function() {
  var opt = {"hour":"numeric","minute":"numeric","second":"numeric"};
  var dtf = new Intl.DateTimeFormat("en", opt);
  return function(value) { return dtf.format(value); }
})()`
    );
  });
});
