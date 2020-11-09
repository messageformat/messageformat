import { TestCase } from './messageformat';

export function customFormatterCases(): TestCase[] {
  const arg = (_v: string, _lc: string, arg: string) => arg;
  const uppercase = (v: string) => v.toUpperCase();
  return [
    {
      options: { customFormatters: { uppercase } },
      src: 'This is {VAR,uppercase}.',
      exp: [[{ VAR: 'big' }, 'This is BIG.']]
    },
    {
      options: { customFormatters: { arg } },
      src: 'This is {_, arg, X, Y }.',
      exp: [[{}, 'This is X, Y.']]
    },
    {
      options: { customFormatters: { arg } },
      src: 'This is {_, arg, {VAR, select, x{X} other{Y}}}.',
      exp: [[{ VAR: 'x' }, 'This is X.']]
    },
    {
      options: { customFormatters: { arg } },
      src: 'This is {VAR, plural, one{} other{{_, arg, #}}}.',
      exp: [[{ VAR: 99 }, 'This is 99.']]
    }
  ];
}

export function dateSkeletonCases(): TestCase[] {
  // 2006 Jan 2, 15:04:05.789 in local time
  const date = new Date(2006, 0, 2, 15, 4, 5, 789);
  const cases: { [key: string]: { exp: string | RegExp; skip?: string[] } } = {
    GGGGyMMMM: { exp: 'January 2006 Anno Domini' },
    GGGGGyyMMMMM: { exp: 'J 06 A' },
    GrMMMdd: { exp: 'Jan 02, 2006 AD' },
    GMMd: { exp: '01/2 AD' },
    hamszzzz: { exp: /^3:0?4:0?5 PM [A-Z]/ },
    Mk: { exp: '1, 15', skip: ['node10'] }
  };
  return Object.entries(cases).map(([fmt, { exp, skip }]) => ({
    src: `{date, date, ::${fmt}}`,
    exp: [[{ date }, exp]],
    skip: (skip || []).concat(['ie'])
  }));
}

export function numberPatternCases(): TestCase[] {
  const cases: {
    [fmt: string]: {
      value: number;
      lc: string;
      cur?: string;
      skip?: string[];
      exp: string | RegExp;
    };
  } = {
    '#,##0.##': {
      value: 1234.567,
      lc: 'fr',
      exp: /^1\s234,57$/,
      skip: ['node10', 'node12']
    },
    '#,##0.###': {
      value: 1234.567,
      lc: 'fr',
      exp: /^1\s234,567$/,
      skip: ['node10', 'node12']
    },
    '###0.#####': {
      value: 1234.567,
      lc: 'fr',
      exp: '1234,567',
      skip: ['node10', 'node12']
    },
    '###0.0000#': {
      value: 1234.567,
      lc: 'fr',
      exp: '1234,5670',
      skip: ['node10', 'node12']
    },
    '00000.0000': {
      value: 1234.567,
      lc: 'fr',
      exp: '01234,5670',
      skip: ['node10', 'node12']
    },
    '#,##0.00 ¤': {
      value: 1234.567,
      lc: 'fr',
      cur: 'EUR',
      exp: /^1\s234,57\s€$/,
      skip: ['node10', 'node12']
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
    '#,##0.65': { value: 1.234, lc: 'en', exp: '1.3' },
    '¤': { value: 12, lc: 'en', cur: 'CAD', exp: 'CA$12.00', skip: ['ie'] },
    '¤¤': { value: 12, lc: 'en', cur: 'CAD', exp: /^CAD\s12.00$/, skip: ['safari'] },
    '¤¤¤': {
      value: 5,
      lc: 'en',
      cur: 'CAD',
      exp: '5.00 Canadian dollars',
      skip: ['ie']
    },
    '¤¤¤¤¤': {
      value: 12,
      lc: 'en',
      cur: 'CAD',
      exp: '$12.00',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    '¤#,##0.00;(¤#,##0.00)': {
      value: -3.27,
      lc: 'en',
      cur: 'USD',
      exp: '($3.27)',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    '0.###E0': {
      value: 1234,
      lc: 'en',
      exp: '1.234E3',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    '00.###E0': {
      value: 0.00123,
      lc: 'en',
      exp: '01.23E-3',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    '##0.####E0': {
      value: 12345,
      lc: 'en',
      exp: '12.345E3',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    }
  };
  return Object.entries(cases).map(([fmt, { value, lc, cur, exp, skip }]) => ({
    locale: lc,
    options: cur ? { currency: cur } : undefined,
    skip,
    src: `{value, number, ${fmt}}`,
    exp: [[{ value }, exp]] // IE 11: res.replace(/\s/g, ' ')
  }));
}

export function numberSkeletonCases(): TestCase[] {
  const cases: {
    [fmt: string]: {
      value: number;
      skip?: string[];
      exp: string | RegExp;
    };
  } = {
    '.00': { value: 42, exp: '42.00' },
    'scale/100': { value: 42, exp: '4,200' },
    'compact-short': { value: 42, exp: '42' },
    'compact-long': { value: 42, exp: '42' },
    'group-min2': { value: 42, exp: '42' },
    'measure-unit/length-meter': {
      value: 42,
      exp: '42 m',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'measure-unit/length-meter unit-width-full-name': {
      value: 42,
      exp: '42 meters',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'currency/CAD': { value: 42, exp: 'CA$42.00', skip: ['ie', 'ff'] },
    'currency/CAD unit-width-narrow': {
      value: 42,
      exp: '$42.00',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'compact-short currency/CAD': {
      value: 42,
      exp: 'CA$42',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'sign-always': {
      value: 42,
      exp: '+42',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'sign-except-zero': {
      value: 42,
      exp: '+42',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'sign-accounting currency/CAD': {
      value: -42,
      exp: '(CA$42.00)',
      skip: ['ie', 'edge', 'ff', 'node10', 'safari']
    },
    'percent .00': { value: 42, exp: '42.00%', skip: ['ie'] }
  };
  return Object.entries(cases).map(([fmt, { value, exp, skip }]) => ({
    src: `{value, number, :: ${fmt}}`,
    skip,
    exp: [[{ value }, exp]] // IE 11: res.replace(/\s/g, ' ')
  }));
}
