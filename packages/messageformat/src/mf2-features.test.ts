// @ts-ignore
import { source } from 'common-tags';
import { compileFluent, compileMF1 } from '@messageformat/compiler';

import {
  fluentRuntime,
  Formattable,
  FormattableNumber,
  MessageFormat,
  Resource,
  Runtime,
  RuntimeOptions
} from './index';
import { MessageFormatPart } from './formatted-part';
import type { FunctionRef, Literal, MessageRef } from './pattern';

test('Dynamic References (unicode-org/message-format-wg#130)', () => {
  const res: Resource<Literal | MessageRef> = {
    type: 'resource',
    id: 'res',
    locale: 'fi',
    entries: {
      browser: {
        type: 'group',
        entries: {
          chrome: {
            type: 'group',
            entries: {
              nominative: {
                type: 'message',
                value: [{ type: 'literal', value: 'Chrome' }]
              },
              genitive: {
                type: 'message',
                value: [{ type: 'literal', value: 'Chromen' }]
              }
            }
          },
          edge: {
            type: 'group',
            entries: {
              nominative: {
                type: 'message',
                value: [{ type: 'literal', value: 'Edge' }]
              },
              genitive: {
                type: 'message',
                value: [{ type: 'literal', value: 'Edgen' }]
              }
            }
          },
          firefox: {
            type: 'group',
            entries: {
              nominative: {
                type: 'message',
                value: [{ type: 'literal', value: 'Firefox' }]
              },
              genitive: {
                type: 'message',
                value: [{ type: 'literal', value: 'Firefoxin' }]
              }
            }
          },
          safari: {
            type: 'group',
            entries: {
              nominative: {
                type: 'message',
                value: [{ type: 'literal', value: 'Safari' }]
              },
              genitive: {
                type: 'message',
                value: [{ type: 'literal', value: 'Safarin' }]
              }
            }
          }
        }
      },
      settings: {
        type: 'message',
        value: [
          {
            type: 'term',
            msg_path: [
              { type: 'literal', value: 'browser' },
              {
                type: 'variable',
                var_path: [{ type: 'literal', value: 'browser-id' }]
              },
              { type: 'literal', value: 'genitive' }
            ]
          },
          { type: 'literal', value: ' asetukset' }
        ]
      }
    }
  };
  const mf = new MessageFormat('fi', null, res);

  const msg = mf.format('settings', { 'browser-id': 'firefox' });
  expect(msg).toBe('Firefoxin asetukset');

  const parts = mf.formatToParts('settings', {
    'browser-id': 'firefox'
  });
  expect(parts).toMatchObject([
    { type: 'literal', value: 'Firefoxin' },
    { type: 'literal', value: ' asetukset' }
  ]);
});

describe('Plural Range Selectors & Range Formatters (unicode-org/message-format-wg#125)', () => {
  function parseRangeArgs(
    start_: FormattableNumber | Formattable<{ start: number; end: number }>,
    end_: FormattableNumber | undefined
  ) {
    const start = start_.getValue();
    const end = end_?.getValue();
    if (typeof end === 'number') {
      if (typeof start !== 'number' && typeof start !== 'string')
        throw new Error(`Invalid arguments (${start}, ${end})`);
      return { start: Number(start), end: Number(end) };
    } else {
      if (!start || typeof start !== 'object')
        throw new Error(`Invalid arguments (${start}, ${end})`);
      return { start: start.start, end: start.end };
    }
  }
  function formatRange(
    _locales: string[],
    _options: RuntimeOptions | undefined,
    start: FormattableNumber | Formattable<{ start: number; end: number }>,
    end?: FormattableNumber
  ) {
    const range = parseRangeArgs(start, end);
    return `${range.start} - ${range.end}`;
  }
  function pluralRange(
    locales: string[],
    options: RuntimeOptions | undefined,
    start: FormattableNumber | Formattable<{ start: number; end: number }>,
    end?: FormattableNumber
  ) {
    if (locales[0] !== 'nl') throw new Error('Only Dutch supported');
    const range = parseRangeArgs(start, end);
    const pr = new Intl.PluralRules(locales, options);
    return [pr.select(range.end)];
  }
  const runtime: Runtime = {
    formatRange: {
      call: formatRange,
      options: { start: 'any', end: 'number' }
    },
    pluralRange: {
      call: pluralRange,
      options: { start: 'any', end: 'number' }
    }
  };

  test('input as { start, end } object', () => {
    const res: Resource<Literal | FunctionRef> = {
      type: 'resource',
      id: 'res',
      locale: 'nl',
      entries: {
        msg: {
          type: 'select',
          select: [
            {
              value: {
                type: 'function',
                func: 'pluralRange',
                args: [
                  {
                    type: 'variable',
                    var_path: [{ type: 'literal', value: 'range' }]
                  }
                ]
              }
            }
          ],
          cases: [
            {
              key: ['one'],
              value: [
                {
                  type: 'function',
                  func: 'formatRange',
                  args: [
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'range' }]
                    }
                  ]
                },
                { type: 'literal', value: ' dag' }
              ]
            },
            {
              key: ['other'],
              value: [
                {
                  type: 'function',
                  func: 'formatRange',
                  args: [
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'range' }]
                    }
                  ]
                },
                { type: 'literal', value: ' dagen' }
              ]
            }
          ]
        }
      }
    };
    const mf = new MessageFormat('nl', { runtime }, res);

    const msg1 = mf.format('msg', { range: { start: 0, end: 1 } });
    expect(msg1).toBe('0 - 1 dag');

    const msg2 = mf.format('msg', { range: { start: 1, end: 2 } });
    expect(msg2).toBe('1 - 2 dagen');
  });

  test('input as separate start, end falues', () => {
    const res: Resource<Literal | FunctionRef> = {
      type: 'resource',
      id: 'res',
      locale: 'nl',
      entries: {
        msg: {
          type: 'select',
          select: [
            {
              value: {
                type: 'function',
                func: 'pluralRange',
                args: [
                  {
                    type: 'variable',
                    var_path: [{ type: 'literal', value: 'start' }]
                  },
                  {
                    type: 'variable',
                    var_path: [{ type: 'literal', value: 'end' }]
                  }
                ]
              }
            }
          ],
          cases: [
            {
              key: ['one'],
              value: [
                {
                  type: 'function',
                  func: 'formatRange',
                  args: [
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'start' }]
                    },
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'end' }]
                    }
                  ]
                },
                { type: 'literal', value: ' dag' }
              ]
            },
            {
              key: ['other'],
              value: [
                {
                  type: 'function',
                  func: 'formatRange',
                  args: [
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'start' }]
                    },
                    {
                      type: 'variable',
                      var_path: [{ type: 'literal', value: 'end' }]
                    }
                  ]
                },
                { type: 'literal', value: ' dagen' }
              ]
            }
          ]
        }
      }
    };
    const mf = new MessageFormat('nl', { runtime }, res);

    const msg1 = mf.format('msg', { start: 0, end: 1 });
    expect(msg1).toBe('0 - 1 dag');

    const msg2 = mf.format('msg', { start: 1, end: 2 });
    expect(msg2).toBe('1 - 2 dagen');
  });
});

describe('Multi-selector messages (unicode-org/message-format-wg#119)', () => {
  test('All-inclusive resort (@nbouvrette)', () => {
    const src = source`
      This all-inclusive resort includes {poolCount, plural,
        =0 {no pools} one {# pool} other {# pools}
      }, {restaurantCount, plural,
        =0 {no restaurants} one {# restaurant} other {# restaurants}
      }, {beachCount, plural,
        =0 {no beaches} one {# beach} other {# beaches}
      } and {golfCount, plural,
        =0 {no golf courses} one {# golf course} other {# golf courses}
      }.`;
    const res = compileMF1({ msg: src }, { id: 'res', locale: 'en' });
    expect((res.entries.msg as any).select).toHaveLength(4);
    expect((res.entries.msg as any).cases).toHaveLength(81);

    const mf = new MessageFormat('en', null, res);

    const none = mf.format('msg', {
      poolCount: 0,
      restaurantCount: 0,
      beachCount: 0,
      golfCount: 0
    });
    expect(none).toBe(
      'This all-inclusive resort includes no pools, no restaurants, no beaches and no golf courses.'
    );

    const one = mf.format('msg', {
      poolCount: 1,
      restaurantCount: 1,
      beachCount: 1,
      golfCount: 1
    });
    expect(one).toBe(
      'This all-inclusive resort includes 1 pool, 1 restaurant, 1 beach and 1 golf course.'
    );

    const two = mf.format('msg', {
      poolCount: 2,
      restaurantCount: 2,
      beachCount: 2,
      golfCount: 2
    });
    expect(two).toBe(
      'This all-inclusive resort includes 2 pools, 2 restaurants, 2 beaches and 2 golf courses.'
    );
  });

  test('Item list (@eemeli)', () => {
    const src = source`
      Listing
      {N, plural, one{one} other{#}}
      {LIVE, select, undefined{} other{current and future}}
      {TAG}
      {N, plural, one{item} other{items}}
      {DAY, select, undefined{} other{on {DAY} {TIME, select, undefined{} other{after {TIME}}}}}
      {AREA, select, undefined{} other{in {AREA}}}
      {Q, select, undefined{} other{matching the query {Q}}}
    `;
    const res = compileMF1({ msg: src }, { id: 'res', locale: 'en' });
    expect((res.entries.msg as any).select).toHaveLength(6);
    expect((res.entries.msg as any).cases).toHaveLength(64);

    const mf = new MessageFormat('en', null, res);

    const one = mf.format('msg', {
      N: 1,
      LIVE: String(undefined),
      TAG: 'foo',
      DAY: String(undefined),
      AREA: String(undefined),
      Q: String(undefined)
    });
    expect(one.replace(/\s+/g, ' ').trim()).toBe('Listing one foo item');

    const two = mf.format('msg', {
      N: 2,
      LIVE: true,
      TAG: 'foo',
      DAY: String(undefined),
      AREA: 'there',
      Q: '"bar"'
    });
    expect(two.replace(/\s+/g, ' ').trim()).toBe(
      'Listing 2 current and future foo items in there matching the query "bar"'
    );
  });

  test('Mozilla activity (@stasm)', () => {
    const src = source`
      activity-needed-calculation-plural = { NUMBER($totalHours) ->
          [one] {$totalHours} hour
        *[other] {$totalHours} hours
      } is achievable in just over { NUMBER($periodMonths) ->
          [one] {$periodMonths} month
        *[other] {$periodMonths} months
      } if { NUMBER($people) ->
          [one] {$people} person
        *[other] {$people} people
      } record { NUMBER($clipsPerDay) ->
          [one] {$clipsPerDay} clip
        *[other] {$clipsPerDay} clips
      } a day.
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);

    const one = mf.format('activity-needed-calculation-plural', {
      totalHours: 1,
      periodMonths: 1,
      people: 1,
      clipsPerDay: 1
    });
    expect(one).toBe(
      '1 hour is achievable in just over 1 month if 1 person record 1 clip a day.'
    );

    const two = mf.format('activity-needed-calculation-plural', {
      totalHours: 2,
      periodMonths: 2,
      people: 2,
      clipsPerDay: 2
    });
    expect(two).toBe(
      '2 hours is achievable in just over 2 months if 2 people record 2 clips a day.'
    );
  });
});

const maybe = process.version > 'v14' ? describe : describe.skip;
maybe('List formatting', () => {
  test('Intl.ListFormat, combine/flatten inputs (unicode-org/message-format-wg#36)', () => {
    function LIST(
      locales: string[],
      options: RuntimeOptions | undefined,
      ...args: Formattable<string | string[]>[]
    ) {
      let list: string[] = [];
      for (const arg of args) list = list.concat(arg.getValue());
      // @ts-ignore
      const lf = new Intl.ListFormat(locales, options);
      return lf.format(list);
    }
    const runtime = Object.assign(
      { LIST: { call: LIST, options: 'any' as const } },
      fluentRuntime
    );

    const src = source`
      plain = { LIST($list) }
      and = { LIST($list, style: "short", type: "conjunction") }
      or = { LIST($list, style: "long", type: "disjunction") }
      or-other = { LIST($list, "another vehicle", type: "disjunction") }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const mf = new MessageFormat('en', { runtime }, res);
    const list = ['Motorcycle', 'Bus', 'Car'];

    const plainMsg = mf.format('plain', { list });
    expect(plainMsg).toBe('Motorcycle, Bus, and Car');

    const andMsg = mf.format('and', { list });
    expect(andMsg).toBe('Motorcycle, Bus, & Car');

    const orMsg = mf.format('or', { list });
    expect(orMsg).toBe('Motorcycle, Bus, or Car');

    const otherMsg = mf.format('or-other', { list });
    expect(otherMsg).toBe('Motorcycle, Bus, Car, or another vehicle');
  });

  test('List formatting with grammatical inflection on each list item (unicode-org/message-format-wg#3)', () => {
    const runtime: Runtime = Object.assign(
      {
        dative: { call: dative, options: 'never' as const },
        LIST: { call: LIST, options: 'any' as const }
      },
      fluentRuntime
    );

    function dative(
      locales: string[],
      _options: unknown,
      arg: Formattable<string>
    ) {
      if (locales[0] !== 'ro') throw new Error('Only Romanian supported');
      const data: Record<string, string> = {
        Maria: 'Mariei',
        Ileana: 'Ilenei',
        Petre: 'lui Petre'
      };
      const value = arg.getValue();
      return data[value] || value;
    }

    function LIST(
      locales: string[],
      options: RuntimeOptions | undefined,
      ...args: Formattable<string | string[]>[]
    ) {
      let list: string[] = [];
      for (const arg of args) list = list.concat(arg.getValue());
      if (typeof options?.each === 'string') {
        const fn = runtime[options.each];
        if (!fn || typeof fn.call !== 'function')
          throw new Error(`list each function not found: ${options.each}`);
        list = list.map(li =>
          String(fn.call(locales, undefined, new Formattable(null, li)))
        );
      }
      // @ts-ignore
      const lf = new Intl.ListFormat(locales, options);
      return lf.format(list);
    }

    const src = source`
      msg = { $count ->
         [one] I-am dat cadouri { LIST($list, each: "dative") }.
        *[other] Le-am dat cadouri { LIST($list, each: "dative") }.
      }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'ro' });
    const mf = new MessageFormat('ro', { runtime }, res);

    const list1 = ['Petre'];
    const msg1 = mf.format('msg', {
      count: list1.length,
      list: list1
    });
    expect(msg1).toBe('I-am dat cadouri lui Petre.');

    const list3 = ['Maria', 'Ileana', 'Petre'];
    const msg3 = mf.format('msg', {
      count: list3.length,
      list: list3
    });
    expect(msg3).toBe('Le-am dat cadouri Mariei, Ilenei și lui Petre.');
  });
});

describe('Neighbouring text transformations (unicode-org/message-format-wg#160)', () => {
  function hackyFixArticles(locales: string[], parts: MessageFormatPart[]) {
    if (locales[0] !== 'en') throw new Error('Only English supported');
    const articly = /(^|\s)(a|an|A|An)(\W*$)/;
    const vowely =
      /^\W*(?:11|18|8|a|e(?![uw])|heir|herb|hon|hour|i|o(?!n[ce])|u[bcdfgklmprstvxz](?![aeiou])|un(?!i))/i;
    const wordy = parts.filter(part => /\w/.test(String(part.value)));
    for (let i = 0; i < wordy.length - 1; ++i) {
      let fixed = false;
      const part = wordy[i];
      const v0 = String(part.value);
      const v1 = v0.replace(articly, (src, pre, article, post) => {
        const isAn = article === 'an' || article === 'An';
        const reqAn = vowely.test(String(wordy[i + 1].value));
        if (isAn === reqAn) return src;

        fixed = true;
        const isCap = article[0] === 'A';
        const fixedArticle = reqAn ? (isCap ? 'An' : 'an') : isCap ? 'A' : 'a';
        return pre + fixedArticle + post;
      });
      if (fixed) part.value = v1;
    }
  }

  const src = source`
    foo = A { $foo } and an { $other }
    bar = The { $foo } and lotsa { $other }
    baz = { $foo } foo and a
    qux = { baz } ... { $other }
  `;
  const res = compileFluent(src, { id: 'res', locale: 'en' });
  const mf = new MessageFormat('en', { runtime: fluentRuntime }, res);

  test('Match, no change', () => {
    const parts = mf.formatToParts('foo', { foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'A ' },
      { type: 'dynamic', value: 'foo', source: '$foo' },
      { type: 'literal', value: ' and an ' },
      { type: 'dynamic', value: 'other', source: '$other' }
    ]);
  });

  test('Match, changed', () => {
    const parts = mf.formatToParts('foo', { foo: 'other', other: 'foo' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'An ' },
      { type: 'dynamic', value: 'other', source: '$foo' },
      { type: 'literal', value: ' and a ' },
      { type: 'dynamic', value: 'foo', source: '$other' }
    ]);
  });

  test('No match, no change', () => {
    const parts = mf.formatToParts('bar', { foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'The ' },
      { type: 'dynamic', value: 'foo', source: '$foo' },
      { type: 'literal', value: ' and lotsa ' },
      { type: 'dynamic', value: 'other', source: '$other' }
    ]);
  });

  test('Articles across messages & variables', () => {
    const parts = mf.formatToParts('qux', { foo: 'An', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'dynamic', value: 'A', source: '-baz/$foo' },
      { type: 'literal', value: ' foo and an', source: '-baz' },
      { type: 'literal', value: ' ... ' },
      { type: 'dynamic', value: 'other', source: '$other' }
    ]);
  });
});
