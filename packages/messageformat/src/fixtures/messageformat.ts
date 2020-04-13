import MessageFormat from '../messageformat';
import { PluralFunction } from '../plurals';

export type TestCase = {
  locale?: string | PluralFunction;
  options?: object;
  src: string;
  exp: Array<
    [any, string | RegExp | { error: true | string | RegExp } | any[]]
  >;
};

export const getTestCases = (MF: typeof MessageFormat) =>
  ({
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
        src:
          '{NUM, plural, zero{a} one{b} two{c} few{d} many{e} other{f} =42{omg42}}',
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
        src:
          '{num, selectordinal, zero{0,7,8,9} one{1} two{2} few{3,4} many{5,6} other{+}}',
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
      { src: MF.escape('{'), exp: [[undefined, '{']] },
      { src: MF.escape('}'), exp: [[undefined, '}']] },
      { src: MF.escape('#'), exp: [[undefined, '#']] },
      { src: MF.escape('#', true), exp: [[undefined, "'#'"]] },
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
        src:
          'The {FLOOR, selectordinal, one{#st} two{#nd} few{#rd} other{#th}} floor.',
        exp: [
          [{ FLOOR: 0 }, 'The 0th floor.'],
          [{ FLOOR: 1 }, 'The 1st floor.'],
          [{ FLOOR: 2 }, 'The 2nd floor.']
        ]
      }
    ],

    'Prototype methods as cases': [
      {
        src:
          'I am {FEELING, select, a{happy} hasOwnProperty{evil} other{indifferent}}.',
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
        src:
          '{HOURS, plural, =0 {{MINUTES, plural, =0 {{SECONDS, plural, =0 {} other {#s}}} other {#m {SECONDS}s}}} other {#h {MINUTES}m {SECONDS}s}}',
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

    strictNumberSign: [
      {
        src: '{X, plural, one{#} other{{Y, select, other{#}}}}',
        exp: [
          [{ X: 3, Y: 5 }, '3'],
          [{ X: 'x' }, /^-?NaN$/] // Edge 18: -NaN
        ]
      },
      {
        options: { strictNumberSign: false },
        src: '{X, plural, one{#} other{{Y, select, other{#}}}}',
        exp: [
          [{ X: 3, Y: 5 }, '3'],
          [{ X: 'x' }, /^-?NaN$/] // Edge 18: -NaN
        ]
      },
      {
        options: { strictNumberSign: true },
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
        options: { strictNumberSign: false },
        src: "{X, plural, one{#} other{{Y, select, other{'#'}}}}",
        exp: [
          [{ X: 3, Y: 5 }, '#'],
          [{ X: 'x' }, '#']
        ]
      },
      {
        options: { strictNumberSign: true },
        src: "{X, plural, one{#} other{{Y, select, other{'#'}}}}",
        exp: [
          [{ X: 3, Y: 5 }, "'#'"],
          [{ X: 'x' }, { error: /\bX\b.*not a number/ }]
        ]
      },
      {
        options: { strictNumberSign: true },
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
    ]
  } as { [title: string]: TestCase[] });
