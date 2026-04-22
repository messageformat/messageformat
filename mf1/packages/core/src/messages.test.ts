import { describe, expect, test } from 'vitest';
import MessageFormat from './messageformat';

import type { PluralFunction } from '@messageformat/core/src/plurals';

export type TestCase = {
  locale?: string | PluralFunction;
  options?: Record<string, unknown>;
  src: string;
  exp: Array<
    [any, string | RegExp | { error: true | string | RegExp } | any[]]
  >;
};

const testCases = {
  'Basic messages': [
    { src: 'This is a string.', exp: [[undefined, 'This is a string.']] },
    {
      src: '{foo}',
      exp: [
        [undefined, { error: true }],
        [{ foo: 'FOO' }, 'FOO']
      ]
    }
  ],

  'CLDR locales': [
    {
      locale: 'cy',
      src: '{NUM, plural, zero{a} one{b} two{c} few{d} many{e} other{f} =42{omg42}}',
      exp: [
        [{ NUM: 0 }, 'a'],
        [{ NUM: 1 }, 'b'],
        [{ NUM: 2 }, 'c'],
        [{ NUM: 3 }, 'd'],
        [{ NUM: 6 }, 'e'],
        [{ NUM: 15 }, 'f'],
        [{ NUM: 42 }, 'omg42']
      ]
    },
    {
      locale: 'cy',
      src: '{num, selectordinal, zero{0,7,8,9} one{1} two{2} few{3,4} many{5,6} other{+}}',
      exp: [[{ num: 5 }, '5,6']]
    }
  ],

  'Custom locales': [
    {
      locale: (_: number) => 'few',
      src: 'res: {val, plural, few{wasfew} other{failed}}',
      exp: [
        [{ val: 0 }, 'res: wasfew'],
        [{ val: 1 }, 'res: wasfew'],
        [{ val: 2 }, 'res: wasfew'],
        [{ val: 3 }, 'res: wasfew'],
        [{}, 'res: wasfew']
      ]
    },

    {
      locale: (_: number, ord: boolean) => (ord ? 'few' : 'other'),
      src: 'res: {val, selectordinal, few{wasfew} other{failed}}',
      exp: [
        [{ val: 0 }, 'res: wasfew'],
        [{ val: 1 }, 'res: wasfew'],
        [{ val: 2 }, 'res: wasfew'],
        [{ val: 3 }, 'res: wasfew'],
        [{}, 'res: wasfew']
      ]
    }
  ],

  'Escaped characters & UTF-8': [
    {
      src: '中{test}中国话不用彁字。',
      exp: [[{ test: '☺' }, '中☺中国话不用彁字。']]
    },
    { src: 'She said "Hello"', exp: [[undefined, 'She said "Hello"']] },
    { src: "I see '{many}'", exp: [[undefined, 'I see {many}']] },
    { src: "I said '{''Wow!''}'", exp: [[undefined, "I said {'Wow!'}"]] },
    { src: "I don't know", exp: [[undefined, "I don't know"]] },
    { src: "I don''t know", exp: [[undefined, "I don't know"]] },
    { src: "'{'", exp: [[undefined, '{']] },
    { src: "'}'", exp: [[undefined, '}']] },
    { src: MessageFormat.escape('{'), exp: [[undefined, '{']] },
    { src: MessageFormat.escape('}'), exp: [[undefined, '}']] },
    { src: MessageFormat.escape('#'), exp: [[undefined, '#']] },
    { src: MessageFormat.escape('#', true), exp: [[undefined, "'#'"]] },
    { src: "'{{{'", exp: [[undefined, '{{{']] },
    { src: "'}}}'", exp: [[undefined, '}}}']] },
    { src: "'{{{'{test}'}}}'", exp: [[{ test: 4 }, '{{{4}}}']] },
    {
      src: "'{{{'{test, plural, other{#}}'}}}'",
      exp: [[{ test: 4 }, '{{{4}}}']]
    }
  ],

  'Simple variables': [
    { src: 'The var is {VAR}.', exp: [[{ VAR: 5 }, 'The var is 5.']] },
    { src: 'The var is {0}.', exp: [[{ '0': 5 }, 'The var is 5.']] },
    { src: 'The var is {0}.', exp: [[[5], 'The var is 5.']] },
    {
      src: 'The vars are {0} and {1}.',
      exp: [[[5, -3], 'The vars are 5 and -3.']]
    },
    {
      src: 'The vars are {0} and {01}.',
      exp: [[[5, -3], 'The vars are 5 and undefined.']]
    }
  ],

  Plurals: [
    {
      src: '{VAR, plural, other{The var is #.}}',
      exp: [[{ VAR: 5 }, 'The var is 5.']]
    },
    {
      src: '{0, plural, other{The var is #.}}',
      exp: [[[5], 'The var is 5.']]
    },
    {
      src: '{VAR, plural, offset:1 other{The var is #.}}',
      exp: [[{ VAR: 5 }, 'The var is 4.']]
    },
    {
      src: '{X, plural, other{{Y, select, other{The var is #.}}}}',
      exp: [[{ X: 5, Y: 'key' }, 'The var is 5.']]
    },

    { src: "{X, plural, other{# is a '#'}}", exp: [[{ X: 3 }, '3 is a #']] },

    {
      src: 'This is an octothorpe: #',
      exp: [[{ X: 3 }, 'This is an octothorpe: #']]
    },

    {
      src: '{NUM, plural, one{a} other{b}}',
      exp: [
        [{ NUM: '1' }, 'a'],
        [{ NUM: '1.0' }, 'b']
      ]
    },

    {
      src: '{NUM, plural, =34{a} one{b} other{c}}',
      exp: [[{ NUM: 34 }, 'a']]
    }
  ],

  Offset: [
    {
      src: '{NUM, plural, offset:1 =0{a} one{b} other{c}}',
      exp: [
        [{ NUM: 0 }, 'a'],
        [{ NUM: 1 }, 'c'],
        [{ NUM: 2 }, 'b']
      ]
    },

    {
      src: '{NUM, selectordinal, offset:1 =0{literal} one{one} other{other}}',
      exp: [
        [{ NUM: 0 }, 'literal'],
        [{ NUM: 1 }, 'other'],
        [{ NUM: 2 }, 'one']
      ]
    }
  ],

  'Bi-directional text': [
    {
      options: { biDiSupport: true },
      src: '{0} >> {1}',
      exp: [
        [
          ['Hello! English', 'Hello \u0647\u0644\u0627\u060d'],
          '\u200eHello! English\u200e >> \u200eHello \u0647\u0644\u0627\u060d\u200e'
        ]
      ]
    },
    {
      locale: 'ar-EG',
      options: { biDiSupport: true },
      src: '{0} >> {1}',
      exp: [
        [
          ['Hello! English', 'Hello \u0647\u0644\u0627\u060d'],
          '\u200fHello! English\u200f >> \u200fHello \u0647\u0644\u0627\u060d\u200f'
        ]
      ]
    }
  ],

  Selectors: [
    {
      src: 'I am {FEELING, select, a{happy} b{sad} other{indifferent}}.',
      exp: [
        [{ FEELING: 'a' }, 'I am happy.'],
        [{ FEELING: 'b' }, 'I am sad.'],
        [{ FEELING: 'q' }, 'I am indifferent.'],
        [{}, 'I am indifferent.']
      ]
    },
    {
      src: 'I have {FRIENDS, plural, one{one friend} other{# friends}}.',
      exp: [
        [{ FRIENDS: 0 }, 'I have 0 friends.'],
        [{ FRIENDS: 1 }, 'I have one friend.'],
        [{ FRIENDS: 2 }, 'I have 2 friends.']
      ]
    },
    {
      src: 'The {FLOOR, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} floor.',
      exp: [
        [{ FLOOR: 0 }, 'The 0th floor.'],
        [{ FLOOR: 1 }, 'The 1st floor.'],
        [{ FLOOR: 2 }, 'The 2nd floor.']
      ]
    }
  ],

  'Prototype methods as cases': [
    {
      src: 'I am {FEELING, select, a{happy} hasOwnProperty{evil} other{indifferent}}.',
      exp: [[{ FEELING: 'toString' }, 'I am indifferent.']]
    },
    {
      src: 'I have {FRIENDS, plural, one{one friend} other{friends}}.',
      exp: [[{ FRIENDS: 'toString' }, 'I have friends.']]
    }
  ],

  Nesting: [
    {
      src:
        '{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1' +
        '     =0 {no one}' +
        '     =1 {just {GENDER, select, male {him} female {her} other{them}}self}' +
        '    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}' +
        '  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}' +
        '} to {GENDER, select,' +
        '   male {his}' +
        ' female {her}' +
        '  other {their}' +
        '} group.',
      exp: [
        [
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Allie Sexton', GENDER: 'female' },
          'Allie Sexton added no one to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Allie Sexton', GENDER: 'female' },
          'Allie Sexton added just herself to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Allie Sexton', GENDER: 'female' },
          'Allie Sexton added herself and one other person to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Allie Sexton', GENDER: 'female' },
          'Allie Sexton added herself and 2 other people to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Alex Sexton', GENDER: 'male' },
          'Alex Sexton added no one to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Alex Sexton', GENDER: 'male' },
          'Alex Sexton added just himself to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Alex Sexton', GENDER: 'male' },
          'Alex Sexton added himself and one other person to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Alex Sexton', GENDER: 'male' },
          'Alex Sexton added himself and 2 other people to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Al Sexton' },
          'Al Sexton added no one to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Al Sexton' },
          'Al Sexton added just themself to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Al Sexton' },
          'Al Sexton added themself and one other person to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Al Sexton' },
          'Al Sexton added themself and 2 other people to their group.'
        ]
      ]
    },
    {
      src: '{HOURS, plural, =0 {{MINUTES, plural, =0 {{SECONDS, plural, =0 {} other {#s}}} other {#m {SECONDS}s}}} other {#h {MINUTES}m {SECONDS}s}}',
      exp: [[{ HOURS: 1, MINUTES: 10, SECONDS: 15 }, '1h 10m 15s']]
    }
  ],

  requireAllArguments: [
    {
      options: { requireAllArguments: true },
      src: '{foo}',
      exp: [
        [undefined, { error: "Message requires argument 'foo'" }],
        [{}, { error: "Message requires argument 'foo'" }],
        [{ foo: undefined }, { error: "Message requires argument 'foo'" }],
        [{ foo: null }, null],
        [{ foo: '' }, '']
      ]
    },
    {
      options: { requireAllArguments: true },
      src: '{bar} {foo}',
      exp: [[{ bar: 'BAR' }, { error: "Message requires argument 'foo'" }]]
    },
    { src: '{foo, select, other{FOO}}', exp: [[{}, 'FOO']] },
    {
      options: { requireAllArguments: true },
      src: '{foo, select, other{FOO}}',
      exp: [[{}, { error: "Message requires argument 'foo'" }]]
    },
    {
      src: '{bar, select, bar{{foo}} other{OTHER}}',
      exp: [
        [{ bar: null }, 'OTHER'],
        [{ bar: 'bar' }, undefined]
      ]
    },
    {
      options: { requireAllArguments: true },
      src: '{bar, select, bar{{foo}} other{OTHER}}',
      exp: [[{ bar: null }, { error: "Message requires argument 'foo'" }]]
    }
  ],

  returnType: [
    {
      options: { returnType: 'values' },
      src: 'msg',
      exp: [[undefined, ['msg']]]
    },
    {
      options: { returnType: 'values' },
      src: 'msg {foo}',
      exp: [[{ foo: 'FOO' }, ['msg ', 'FOO']]]
    },
    (() => {
      const foo = {};
      return {
        options: { returnType: 'values' },
        src: '{foo} bar',
        exp: [[{ foo }, [foo, ' bar']]]
      } as TestCase;
    })(),
    {
      options: { returnType: 'values' },
      src: 'msg {foo, select, FOO{bar} other{baz}}',
      exp: [[{ foo: 'FOO' }, ['msg ', 'bar']]]
    },
    {
      options: { returnType: 'values' },
      src: 'msg {foo, select, FOO{{bar}} other{baz}}',
      exp: [[{ foo: 'FOO', bar: 'BAR' }, ['msg ', 'BAR']]]
    },
    {
      options: { returnType: 'values' },
      src: 'msg {foo, select, FOO{{bar} end} other{baz}}',
      exp: [[{ foo: 'FOO', bar: 'BAR' }, ['msg ', ['BAR', ' end']]]]
    },
    {
      options: { returnType: 'values' },
      src: '{num} {num, plural, one{one} other{#{num}}}',
      exp: [[{ num: 42 }, [42, ' ', ['42', 42]]]]
    }
  ],

  strict: [
    {
      src: '{X, plural, one{#} other{{Y, select, other{#}}}}',
      exp: [
        [{ X: 3, Y: 5 }, '3'],
        [{ X: 'x' }, /^-?NaN$/] // Edge 18: -NaN
      ]
    },
    {
      options: { strict: false },
      src: '{X, plural, one{#} other{{Y, select, other{#}}}}',
      exp: [
        [{ X: 3, Y: 5 }, '3'],
        [{ X: 'x' }, /^-?NaN$/] // Edge 18: -NaN
      ]
    },
    {
      options: { strict: true },
      src: '{X, plural, one{#} other{{Y, select, other{#}}}}',
      exp: [
        [{ X: 3, Y: 5 }, '#'],
        [{ X: 'x' }, { error: /\bX\b.*not a number/ }]
      ]
    },
    {
      src: "{X, plural, one{#} other{{Y, select, other{'#'}}}}",
      exp: [
        [{ X: 3, Y: 5 }, '#'],
        [{ X: 'x' }, '#']
      ]
    },
    {
      options: { strict: false },
      src: "{X, plural, one{#} other{{Y, select, other{'#'}}}}",
      exp: [
        [{ X: 3, Y: 5 }, '#'],
        [{ X: 'x' }, '#']
      ]
    },
    {
      options: { strict: true },
      src: "{X, plural, one{#} other{{Y, select, other{'#'}}}}",
      exp: [
        [{ X: 3, Y: 5 }, "'#'"],
        [{ X: 'x' }, { error: /\bX\b.*not a number/ }]
      ]
    },
    {
      options: { strict: true },
      src: '{X, selectordinal, one{#} other{{Y, time, short}}}',
      exp: [
        [{ X: 1, Y: 5 }, '1'],
        [{ X: 3, Y: 5 }, /^1?\d:[03]0\s[AP]M$/]
      ]
    },
    {
      options: { strict: true },
      src: '{X, selectordinal, one{#} other{{Y, date, short}}}',
      exp: [[{ X: 3, Y: 5 }, /^(12\/31\/1969|1\/1\/1970)$/]]
    },
    {
      options: { strict: true },
      src:
        'I have {FRIENDS, plural, one{one friend} other{# friends but {ENEMIES, plural, offset:1 ' +
        '=0{no enemies} =1{one nemesis} one{two enemies} other{one nemesis and # enemies}}}}.',
      exp: [
        [{ FRIENDS: 0, ENEMIES: 0 }, 'I have 0 friends but no enemies.'],
        [{}, { error: /\bFRIENDS\b.*not a number/ }],
        [{ FRIENDS: 0 }, { error: /\bENEMIES\b.*not a number/ }],
        [{ ENEMIES: 1 }, { error: /\bFRIENDS\b.*not a number/ }]
      ]
    }
  ],

  'Date formatter': [
    {
      src: 'Today is {T, date}',
      exp: [[{ T: new Date(2016, 1, 21) }, 'Today is Feb 21, 2016']]
    },
    {
      locale: 'fi',
      src: 'Tänään on {T, date}',
      exp: [[{ T: new Date(2016, 1, 21) }, /^Tänään on .*2016/]]
    },
    {
      src: 'Unix time started on {T, date, full}',
      exp: [
        [
          { T: 0 },
          /Unix time started on (Wednesday, December 31, 1969|Thursday, January 1, 1970)/
        ]
      ]
    },
    {
      src: '{sys} became operational on {d0, date, short}',
      exp: [
        [
          { sys: 'HAL 9000', d0: new Date(1999, 0, 12) },
          'HAL 9000 became operational on 1/12/1999'
        ]
      ]
    }
  ],

  'Duration formatter': [
    {
      src: 'It has been {D, duration}',
      exp: [
        [{ D: 12 }, 'It has been 0:12'],
        [{ D: 123 }, 'It has been 2:03'],
        [{ D: '123' }, 'It has been 2:03'],
        [{ D: Infinity }, 'It has been Infinity']
      ]
    },
    {
      src: 'Countdown: {D, duration}',
      exp: [[{ D: -151200.42 }, 'Countdown: -42:00:00.420']]
    }
  ],

  'Number formatter': [
    {
      src: '{N} is {N, number}',
      exp: [[{ N: 123456 }, '123456 is 123,456']]
    },
    {
      src: '{N} is almost {N, number, integer}',
      exp: [[{ N: 3.14 }, '3.14 is almost 3']]
    },
    {
      src: '{P, number, percent} complete',
      exp: [[{ P: 0.99 }, /99( |\xa0)?% complete/]]
      // IE 11 may insert a space or non-breaking space before the % char
    },
    {
      src: 'The total is {V, number, currency}.',
      exp: [[{ V: 5.5 }, 'The total is $5.50.']]
    },
    {
      options: { currency: 'EUR' },
      src: 'The total is {V, number, currency}.',
      exp: [[{ V: 5.5 }, 'The total is €5.50.']]
    },
    {
      options: { currency: 'EUR' },
      src: 'The total is {V, number, currency:GBP}.',
      exp: [[{ V: 5.5 }, 'The total is £5.50.']]
    },
    {
      src: '{N} is almost {N, number, {type}}',
      exp: [[{ N: 3.14, type: 'integer' }, '3.14 is almost 3']]
    }
  ],

  'Time formatter': [
    {
      src: 'The time is now {T, time}',
      exp: [[{ T: 978384385000 }, /^The time is now \d\d?:\d\d:25\sPM$/]]
    },
    {
      locale: 'fi',
      src: 'Kello on nyt {T, time}',
      exp: [[{ T: 978384385000 }, /^Kello on nyt \d\d?.\d\d.25/]]
    },
    (() => {
      const time = new Date(1969, 6, 20, 20, 17, 40);
      time.setMinutes(time.getMinutes() + time.getTimezoneOffset());
      return {
        src: 'The Eagle landed at {T, time, full} on {T, date, full}',
        exp: [
          [
            { T: time },
            /^The Eagle landed at \d\d?:\d\d:40\s[AP]M( \S+)? on \w+day, July \d\d, 1969$/
          ]
        ]
      };
    })()
  ],

  'Custom formatters': (() => {
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
  })(),

  'Date skeletons': (() => {
    // 2006 Jan 2, 15:04:05.789 in local time
    const date = new Date(2006, 0, 2, 15, 4, 5, 789);
    const cases: { [key: string]: { exp: string | RegExp } } = {
      GGGGyMMMM: { exp: 'January 2006 Anno Domini' },
      GGGGGyyMMMMM: { exp: 'J 06 A' },
      GrMMMdd: { exp: 'Jan 02, 2006 AD' },
      GMMd: { exp: '01/2 AD' },
      hamszzzz: { exp: /^3:0?4:0?5\sPM [A-Z]/ },
      Mk: { exp: '1, 15' }
    };
    return Object.entries(cases).map(([fmt, { exp }]) => ({
      src: `{date, date, ::${fmt}}`,
      exp: [[{ date }, exp]]
    }));
  })(),

  'Number patterns': (() => {
    const cases: {
      [fmt: string]: {
        value: number;
        lc: string;
        cur?: string;
        exp: string | RegExp;
      };
    } = {
      '#,##0.##': {
        value: 1234.567,
        lc: 'fr',
        exp: /^1\s234,57$/
      },
      '#,##0.###': {
        value: 1234.567,
        lc: 'fr',
        exp: /^1\s234,567$/
      },
      '###0.#####': {
        value: 1234.567,
        lc: 'fr',
        exp: '1234,567'
      },
      '###0.0000#': {
        value: 1234.567,
        lc: 'fr',
        exp: '1234,5670'
      },
      '00000.0000': {
        value: 1234.567,
        lc: 'fr',
        exp: '01234,5670'
      },
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
      '¤': { value: 12, lc: 'en', cur: 'CAD', exp: 'CA$12.00' },
      '¤¤': {
        value: 12,
        lc: 'en',
        cur: 'CAD',
        exp: /^CAD\s12.00$/
      },
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
    };

    return Object.entries(cases).map(([fmt, { value, lc, cur, exp }]) => ({
      locale: lc,
      options: cur ? { currency: cur } : undefined,
      src: `{value, number, ${fmt}}`,
      exp: [[{ value }, exp]] // IE 11: res.replace(/\s/g, ' ')
    }));
  })(),

  'Number skeletons': (() => {
    const cases: {
      [fmt: string]: {
        value: number;
        exp: string | RegExp;
      };
    } = {
      '.00': { value: 42, exp: '42.00' },
      'scale/100': { value: 42, exp: '4,200' },
      'compact-short': { value: 42, exp: '42' },
      'compact-long': { value: 42, exp: '42' },
      'group-min2': { value: 42, exp: '42' },
      'measure-unit/length-meter': { value: 42, exp: '42 m' },
      'measure-unit/length-meter unit-width-full-name': {
        value: 42,
        exp: '42 meters'
      },
      'currency/CAD': { value: 42, exp: 'CA$42.00' },
      'currency/CAD unit-width-narrow': {
        value: 42,
        exp: '$42.00'
      },
      'compact-short currency/CAD': { value: 42, exp: 'CA$42' },
      'sign-always': { value: 42, exp: '+42' },
      'sign-except-zero': { value: 42, exp: '+42' },
      'sign-accounting currency/CAD': {
        value: -42,
        exp: '(CA$42.00)'
      },
      'percent .00': { value: 42, exp: '42.00%' }
    };
    return Object.entries(cases).map(([fmt, { value, exp }]) => ({
      src: `{value, number, :: ${fmt}}`,
      exp: [[{ value }, exp]]
    }));
  })()
} as { [title: string]: TestCase[] };

for (const [title, cases] of Object.entries(testCases)) {
  describe(title, () => {
    for (const { locale, options, src, exp } of cases) {
      let name = src;
      if (locale || options) {
        const opt = [locale || 'en'];
        for (const [key, value] of Object.entries(options || {})) {
          opt.push(`${key}: ${value}`);
        }
        name = `[${opt.join(', ')}] ${src}`;
      }
      describe(name, () => {
        for (const [param, res] of exp) {
          const strParam = [];
          if (param && typeof param === 'object') {
            for (const [key, value] of Object.entries(param)) {
              strParam.push(`${key}: ${value}`);
            }
          } else {
            strParam.push(String(param));
          }
          test(strParam.join(', '), () => {
            const mf = new MessageFormat(locale || 'en', options);
            const msg = mf.compile(src);
            if (res && typeof res === 'object' && 'error' in res) {
              if (res.error === true) expect(() => msg(param)).toThrow();
              else expect(() => msg(param)).toThrow(res.error);
            } else if (res instanceof RegExp) {
              expect(msg(param)).toMatch(res);
            } else if (Array.isArray(res)) {
              expect(msg(param)).toMatchObject(res);
            } else {
              expect(msg(param)).toBe(res);
            }
          });
        }
      });
    }
  });
}
