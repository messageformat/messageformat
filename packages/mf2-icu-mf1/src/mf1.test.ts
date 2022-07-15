import { validate } from 'messageformat';
import { compileMF1Message, compileMF1MessageData } from './index';

export type TestCase = {
  locale?: string;
  options?: Record<string, boolean | string>;
  src: string;
  exp: [
    Record<string, string | number | Date> | (string | number)[] | undefined,
    string | RegExp
  ][];
  only?: boolean;
};

export const testCases: Record<string, TestCase[]> = {
  'Basic messages': [
    { src: 'This is a string.', exp: [[undefined, 'This is a string.']] },
    {
      src: '{foo}',
      exp: [[{ foo: 'FOO' }, 'FOO']]
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
    }
    //{
    //  src: 'The vars are {0} and {01}.',
    //  exp: [[[5, -3], 'The vars are 5 and undefined.']]
    //}
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
        [{ NUM: '1' }, 'a']
        //[{ NUM: '1.0' }, 'b']
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

  /*
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
  */

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
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Kat', GENDER: 'female' },
          'Kat added no one to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Kat', GENDER: 'female' },
          'Kat added just herself to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Kat', GENDER: 'female' },
          'Kat added herself and one other person to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Kat', GENDER: 'female' },
          'Kat added herself and 2 other people to her group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Kit', GENDER: 'male' },
          'Kit added no one to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Kit', GENDER: 'male' },
          'Kit added just himself to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Kit', GENDER: 'male' },
          'Kit added himself and one other person to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Kit', GENDER: 'male' },
          'Kit added himself and 2 other people to his group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 0, PERSON: 'Kot' },
          'Kot added no one to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 1, PERSON: 'Kot' },
          'Kot added just themself to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 2, PERSON: 'Kot' },
          'Kot added themself and one other person to their group.'
        ],
        [
          { PLURAL_NUM_PEOPLE: 3, PERSON: 'Kot' },
          'Kot added themself and 2 other people to their group.'
        ]
      ]
    },
    {
      src: '{HOURS, plural, =0 {{MINUTES, plural, =0 {{SECONDS, plural, =0 {} other {#s}}} other {#m {SECONDS}s}}} other {#h {MINUTES}m {SECONDS}s}}',
      exp: [[{ HOURS: 1, MINUTES: 10, SECONDS: 15 }, '1h 10m 15s']]
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
      exp: [[{ N: 123456 }, '123,456 is 123,456']]
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
    }
  ],

  'Time formatter': [
    {
      src: 'The time is now {T, time}',
      exp: [[{ T: 978384385000 }, /^The time is now \d\d?:\d\d:25 PM$/]]
    },
    {
      locale: 'fi',
      src: 'Kello on nyt {T, time}',
      exp: [[{ T: 978384385000 }, /^Kello on nyt \d\d?.\d\d.25/]]
    }
  ]
};

for (const [title, cases] of Object.entries(testCases)) {
  describe(title, () => {
    for (const { locale = 'en', options, src, exp, only } of cases) {
      let name = src;
      if (locale || options) {
        const opt = [locale];
        for (const [key, value] of Object.entries(options || {}))
          opt.push(`${key}: ${value}`);
        name = `[${opt.join(', ')}] ${src}`;
      }

      const _describe = only ? describe.only : describe;
      _describe(name, () => {
        for (const [param, res] of exp) {
          const strParam = [];
          if (param && typeof param === 'object')
            for (const [key, value] of Object.entries(param))
              strParam.push(`${key}: ${value}`);
          else strParam.push(String(param));

          test(strParam.join(', '), () => {
            const data = compileMF1MessageData(src, locale);
            const mf = compileMF1Message(data, locale);
            validate(data, mf.resolvedOptions().runtime);
            const msg = mf
              .resolveMessage(param as Record<string, string | number | Date>)
              .toString();
            if (res instanceof RegExp) expect(msg).toMatch(res);
            else expect(msg).toBe(res);
          });
        }
      });
    }
  });
}
