import { MessageFormat } from '../index.ts';
import { date, datetime, time } from './datetime.ts';

const now = new Date();

let log: any;
let warn: any;
let error: any;
beforeAll(() => {
  log = jest.spyOn(console, 'log');
  warn = jest.spyOn(console, 'warn');
  error = jest.spyOn(console, 'error');
});
afterEach(() => {
  expect(log).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
});

for (const locale of Intl.DateTimeFormat.supportedLocalesOf([
  'en',
  'fi',
  'th',
  'ar'
])) {
  describe(`${locale} :datetime`, () => {
    for (const [options, bag] of [
      [
        '',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      ],
      [
        'dateFields=year-month-day dateLength=medium timePrecision=minute',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      ],
      [
        'dateFields=weekday dateLength=short timePrecision=hour timeZoneStyle=short',
        { weekday: 'short', hour: 'numeric', timeZoneName: 'short' }
      ],
      [
        'dateFields=month-day dateLength=short timePrecision=second',
        {
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric'
        }
      ]
    ] as const) {
      test(options || 'default', () => {
        const mf = new MessageFormat(locale, `{$now :datetime ${options}}`, {
          bidiIsolation: 'none',
          functions: { datetime }
        });
        const dtf = new Intl.DateTimeFormat(locale, bag);
        expect(mf.format({ now })).toEqual(dtf.format(now));
        expect(mf.formatToParts({ now })).toMatchObject([
          { parts: dtf.formatToParts(now) }
        ]);
      });
    }
  });

  describe(`${locale} :date`, () => {
    for (const [options, bag] of [
      ['', { year: 'numeric', month: 'short', day: 'numeric' }],
      [
        'fields=year-month-day length=medium',
        { year: 'numeric', month: 'short', day: 'numeric' }
      ],
      [
        'fields=month-day-weekday length=short',
        { month: 'numeric', day: 'numeric', weekday: 'short' }
      ],
      [
        'fields=month-day-weekday length=long',
        { month: 'long', day: 'numeric', weekday: 'long' }
      ]
    ] as const) {
      test(options || 'default', () => {
        const mf = new MessageFormat(locale, `{$now :date ${options}}`, {
          bidiIsolation: 'none',
          functions: { date }
        });
        const dtf = new Intl.DateTimeFormat(locale, bag);
        expect(mf.format({ now })).toEqual(dtf.format(now));
        expect(mf.formatToParts({ now })).toMatchObject([
          { parts: dtf.formatToParts(now) }
        ]);
      });
    }
  });

  describe(`${locale} :time`, () => {
    for (const [options, bag] of [
      ['', { hour: 'numeric', minute: 'numeric' }],
      ['precision=hour', { hour: 'numeric' }],
      ['precision=minute', { hour: 'numeric', minute: 'numeric' }],
      [
        'precision=second',
        { hour: 'numeric', minute: 'numeric', second: 'numeric' }
      ],
      [
        'precision=hour timeZoneStyle=short',
        { hour: 'numeric', timeZoneName: 'short' }
      ],
      [
        'precision=second timeZoneStyle=long',
        {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          timeZoneName: 'long'
        }
      ],
      ['hour12=false', { hour12: false, hour: 'numeric', minute: 'numeric' }],
      ['hour12=true', { hour12: true, hour: 'numeric', minute: 'numeric' }],
      ['timeZone=UTC', { timeZone: 'UTC', hour: 'numeric', minute: 'numeric' }]
    ] as const) {
      test(options || 'default', () => {
        const mf = new MessageFormat(locale, `{$now :time ${options}}`, {
          bidiIsolation: 'none',
          functions: { time }
        });
        const dtf = new Intl.DateTimeFormat(locale, bag);
        expect(mf.format({ now })).toEqual(dtf.format(now));
        expect(mf.formatToParts({ now })).toMatchObject([
          { parts: dtf.formatToParts(now) }
        ]);
      });
    }
  });
}

describe('timeZone option', () => {
  test('timeZone=input, not set on operand', () => {
    const mf = new MessageFormat('en', '{$now :time timeZone=input}', {
      functions: { time }
    });
    const onError = jest.fn();
    mf.format({ now }, onError);
    expect(onError.mock.calls).toMatchObject([[{ type: 'bad-operand' }]]);
  });

  for (const timeZone of ['UTC', 'America/Chicago', 'Etc/GMT+8', '+23'].filter(
    timeZone => {
      try {
        new Intl.DateTimeFormat(undefined, { timeZone });
        return true;
      } catch {
        return false;
      }
    }
  )) {
    describe(`timeZone ${timeZone}`, () => {
      test('set on operand, with timeZone=input', () => {
        const mf = new MessageFormat('en', '{$now2 :time timeZone=input}', {
          functions: { time }
        });
        const now2 = Object.assign(new Date(), { options: { timeZone } });
        const dtf = new Intl.DateTimeFormat('en', {
          timeZone,
          hour: 'numeric',
          minute: 'numeric'
        });
        expect(mf.format({ now2 })).toEqual(dtf.format(now2));
      });

      test('set to same on both operand and expression', () => {
        const mf = new MessageFormat(
          'en',
          `{$now2 :time timeZone=|${timeZone}|}`,
          { functions: { time } }
        );
        const now2 = Object.assign(new Date(), { options: { timeZone } });
        const dtf = new Intl.DateTimeFormat('en', {
          timeZone,
          hour: 'numeric',
          minute: 'numeric'
        });
        expect(mf.format({ now2 })).toEqual(dtf.format(now2));
      });

      test('set different on operand and expression', () => {
        const mf = new MessageFormat('en', '{$now2 :time timeZone=|Etc/UTC|}', {
          bidiIsolation: 'none',
          functions: { time }
        });
        const onError = jest.fn();
        const now2 = Object.assign(new Date(), { options: { timeZone } });
        expect(mf.format({ now2 }, onError)).toEqual('{$now2}');
        expect(onError.mock.calls).toMatchObject([[{ type: 'bad-option' }]]);
      });
    });
  }
});
