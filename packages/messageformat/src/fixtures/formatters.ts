import { TestCase } from './messageformat';

// const NODE_VERSION = typeof process === 'undefined' ? 99 : parseInt(process.version.slice(1));

// MS Edge adds LTR/RTL marks around Date#toLocale*String parts
// function dropBiDi(str) { return str.replace(/[\u200e\u200f]/g, ''); }

// const isIE11 =
//   typeof window !== 'undefined' &&
//   !!window.MSInputMethodContext &&
//   !!document.documentMode;

export function dateSkeletonCases(): TestCase[] {
  // 2006 Jan 2, 15:04:05.789 in local time
  const date = new Date(2006, 0, 2, 15, 4, 5, 789);
  const cases = {
    GGGGyMMMM: { exp: 'January 2006 Anno Domini' },
    GGGGGyyMMMMM: { exp: 'J 06 A' },
    GrMMMdd: { exp: 'Jan 02, 2006 AD' },
    GMMd: { exp: '01/2 AD' },
    hamszzzz: { exp: /^3:0?4:0?5 PM [A-Z]/ },
    Mk: { exp: '1, 15' } // Node 8 says '3 PM' for k
  };
  return Object.entries(cases).map(([fmt, { exp }]) => ({
    src: `{date, date, ::${fmt}}`,
    exp: [[{ date }, exp]]
  }));
}

export function numberPatternCases(): TestCase[] {
  const cases: {
    [fmt: string]: {
      value: number;
      lc: string;
      cur?: string;
      exp: string | RegExp;
    };
  } = {
    '#,##0.##': { value: 1234.567, lc: 'fr', exp: /^1\s234,57$/ },
    '#,##0.###': { value: 1234.567, lc: 'fr', exp: /^1\s234,567$/ },
    '###0.#####': { value: 1234.567, lc: 'fr', exp: '1234,567' },
    '###0.0000#': { value: 1234.567, lc: 'fr', exp: '1234,5670' },
    '00000.0000': { value: 1234.567, lc: 'fr', exp: '01234,5670' },
    '#,##0.00 ¤': {
      value: 1234.567,
      lc: 'fr',
      cur: 'EUR',
      exp: /^1\s234,57\s€$/
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
    '¤': { value: 12, lc: 'en', cur: 'CAD', exp: 'CA$12.00' }, // Node 12
    '¤¤': { value: 12, lc: 'en', cur: 'CAD', exp: /^CAD\s12.00$/ }, // Node 12
    '¤¤¤': { value: 5, lc: 'en', cur: 'CAD', exp: '5.00 Canadian dollars' }, // Node 12
    '¤¤¤¤¤': { value: 12, lc: 'en', cur: 'CAD', exp: '$12.00' }, // Node 12
    '¤#,##0.00;(¤#,##0.00)': {
      value: -3.27,
      lc: 'en',
      cur: 'USD',
      exp: '($3.27)'
    }, // Node 12
    '0.###E0': { value: 1234, lc: 'en', exp: '1.234E3' }, // Node 12
    '00.###E0': { value: 0.00123, lc: 'en', exp: '01.23E-3' }, // Node 12
    '##0.####E0': { value: 12345, lc: 'en', exp: '12.345E3' } // Node 12
  };
  return Object.entries(cases).map(([fmt, { value, lc, cur, exp }]) => ({
    locale: lc,
    options: cur ? { currency: cur } : undefined,
    src: `{value, number, ${fmt}}`,
    exp: [[{ value }, exp]] // IE 11: res.replace(/\s/g, ' ')
  }));
}

export function numberSkeletonCases(): TestCase[] {
  const cases: Array<[string, number, string]> = [
    ['.00', 42, '42.00'],
    ['scale/100', 42, '4,200'],
    ['compact-short', 42, '42'],
    ['compact-long', 42, '42'],
    ['group-min2', 42, '42'],
    ['measure-unit/length-meter', 42, '42 m'], // Node 12
    ['measure-unit/length-meter unit-width-full-name', 42, '42 meters'], // Node 12
    ['currency/CAD', 42, 'CA$42.00'], // Node 12
    ['currency/CAD unit-width-narrow', 42, '$42.00'], // Node 12
    ['compact-short currency/CAD', 42, 'CA$42'], // Node 12
    ['sign-always', 42, '+42'], // Node 12
    ['sign-except-zero', 42, '+42'], // Node 12
    ['sign-accounting currency/CAD', -42, '(CA$42.00)'], // Node 12
    ['percent .00', 42, '42.00%'] // IE 11: res.replace(/\u2004/g, '').replace(/\s%/, '%');
  ];

  return cases.map(([fmt, value, exp]) => ({
    src: `{value, number, :: ${fmt}}`,
    exp: [[{ value }, exp]]
  }));
}
