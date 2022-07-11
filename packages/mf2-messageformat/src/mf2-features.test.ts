import { compileFluent, compileMF1 } from '@messageformat/compiler';
import { source } from '@messageformat/test-utils';

import {
  getFluentRuntime,
  MessageValue,
  MessageNumber,
  MessageFormat,
  MessageGroup,
  Runtime,
  RuntimeOptions
} from './index';
import { ResolvedMessage } from './message-value';

describe('Plural Range Selectors & Range Formatters (unicode-org/message-format-wg#125)', () => {
  function parseRangeArgs(
    start_: MessageNumber | MessageValue<{ start: number; end: number }>,
    end_: MessageNumber | undefined
  ) {
    const start = start_.value;
    const end = end_?.value;
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
    start: MessageNumber | MessageValue<{ start: number; end: number }>,
    end?: MessageNumber
  ) {
    const range = parseRangeArgs(start, end);
    return `${range.start} - ${range.end}`;
  }
  function pluralRange(
    locales: string[],
    options: RuntimeOptions | undefined,
    start: MessageNumber | MessageValue<{ start: number; end: number }>,
    end?: MessageNumber
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
    const res: MessageGroup = {
      type: 'group',
      entries: {
        msg: {
          type: 'select',
          selectors: [
            {
              value: {
                type: 'expression',
                name: 'pluralRange',
                operand: { type: 'variable', name: 'range' }
              }
            }
          ],
          variants: [
            {
              key: ['one'],
              value: {
                type: 'message',
                pattern: [
                  {
                    type: 'expression',
                    name: 'formatRange',
                    operand: { type: 'variable', name: 'range' }
                  },
                  { type: 'literal', value: ' dag' }
                ]
              }
            },
            {
              key: ['other'],
              value: {
                type: 'message',
                pattern: [
                  {
                    type: 'expression',
                    name: 'formatRange',
                    operand: { type: 'variable', name: 'range' }
                  },
                  { type: 'literal', value: ' dagen' }
                ]
              }
            }
          ]
        }
      }
    };
    const mf = new MessageFormat('nl', { runtime }, res);

    const msg1 = mf.getMessage('msg', { range: { start: 0, end: 1 } });
    expect(msg1?.toString()).toBe('0 - 1 dag');

    const msg2 = mf.getMessage('msg', { range: { start: 1, end: 2 } });
    expect(msg2?.toString()).toBe('1 - 2 dagen');
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
    const res = compileMF1({ msg: src }, { locale: 'en' });
    expect((res.entries.msg as any).selectors).toHaveLength(4);
    expect((res.entries.msg as any).variants).toHaveLength(81);

    const mf = new MessageFormat('en', null, res);

    const none = mf.getMessage('msg', {
      poolCount: 0,
      restaurantCount: 0,
      beachCount: 0,
      golfCount: 0
    });
    expect(none?.toString()).toBe(
      'This all-inclusive resort includes no pools, no restaurants, no beaches and no golf courses.'
    );

    const one = mf.getMessage('msg', {
      poolCount: 1,
      restaurantCount: 1,
      beachCount: 1,
      golfCount: 1
    });
    expect(one?.toString()).toBe(
      'This all-inclusive resort includes 1 pool, 1 restaurant, 1 beach and 1 golf course.'
    );

    const two = mf.getMessage('msg', {
      poolCount: 2,
      restaurantCount: 2,
      beachCount: 2,
      golfCount: 2
    });
    expect(two?.toString()).toBe(
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
    const res = compileMF1({ msg: src }, { locale: 'en' });
    expect((res.entries.msg as any).selectors).toHaveLength(6);
    expect((res.entries.msg as any).variants).toHaveLength(64);

    const mf = new MessageFormat('en', null, res);

    const one = mf.getMessage('msg', {
      N: 1,
      LIVE: String(undefined),
      TAG: 'foo',
      DAY: String(undefined),
      AREA: String(undefined),
      Q: String(undefined)
    });
    expect(one?.toString().replace(/\s+/g, ' ').trim()).toBe(
      'Listing one foo item'
    );

    const two = mf.getMessage('msg', {
      N: 2,
      LIVE: true,
      TAG: 'foo',
      DAY: String(undefined),
      AREA: 'there',
      Q: '"bar"'
    });
    expect(two?.toString().replace(/\s+/g, ' ').trim()).toBe(
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
    const res = compileFluent(src);
    const mf = new MessageFormat('en', { runtime: getFluentRuntime }, res);

    const one = mf.getMessage('activity-needed-calculation-plural', {
      totalHours: 1,
      periodMonths: 1,
      people: 1,
      clipsPerDay: 1
    });
    expect(one?.toString()).toBe(
      '1 hour is achievable in just over 1 month if 1 person record 1 clip a day.'
    );

    const two = mf.getMessage('activity-needed-calculation-plural', {
      totalHours: 2,
      periodMonths: 2,
      people: 2,
      clipsPerDay: 2
    });
    expect(two?.toString()).toBe(
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
      arg?: MessageValue<string | string[]>
    ) {
      const list = arg
        ? Array.isArray(arg.value)
          ? arg.value
          : [arg.value]
        : [];
      // @ts-ignore
      const lf = new Intl.ListFormat(locales, options);
      return lf.format(list);
    }
    const runtime = (mf: MessageFormat) =>
      Object.assign(
        { LIST: { call: LIST, options: 'any' as const } },
        getFluentRuntime(mf)
      );

    const src = source`
      plain = { LIST($list) }
      and = { LIST($list, style: "short", type: "conjunction") }
      or = { LIST($list, style: "long", type: "disjunction") }
    `;
    const res = compileFluent(src);
    const mf = new MessageFormat('en', { runtime }, res);
    const list = ['Motorcycle', 'Bus', 'Car'];

    const plainMsg = mf.getMessage('plain', { list });
    expect(plainMsg?.toString()).toBe('Motorcycle, Bus, and Car');

    const andMsg = mf.getMessage('and', { list });
    expect(andMsg?.toString()).toBe('Motorcycle, Bus, & Car');

    const orMsg = mf.getMessage('or', { list });
    expect(orMsg?.toString()).toBe('Motorcycle, Bus, or Car');
  });

  test('List formatting with grammatical inflection on each list item (unicode-org/message-format-wg#3)', () => {
    function dative(
      locales: string[],
      _options: unknown,
      arg: MessageValue<string>
    ) {
      if (locales[0] !== 'ro') throw new Error('Only Romanian supported');
      const data: Record<string, string> = {
        Maria: 'Mariei',
        Ileana: 'Ilenei',
        Petre: 'lui Petre'
      };
      return data[arg.value] || arg.value;
    }

    const getListCall = (runtime: Runtime) =>
      function LIST(
        locales: string[],
        options: RuntimeOptions | undefined,
        arg?: MessageValue<string | string[]>
      ) {
        let list = arg
          ? Array.isArray(arg.value)
            ? arg.value
            : [arg.value]
          : [];
        if (typeof options?.each === 'string') {
          const fn = runtime[options.each];
          if (!fn || typeof fn.call !== 'function')
            throw new Error(`list each function not found: ${options.each}`);
          list = list.map(li =>
            String(
              fn.call(
                locales,
                undefined,
                new MessageValue(MessageValue.type, null, li)
              )
            )
          );
        }
        // @ts-ignore
        const lf = new Intl.ListFormat(locales, options);
        return lf.format(list);
      };

    const runtime = (mf: MessageFormat) => {
      const rt = Object.assign(
        { dative: { call: dative, options: 'never' as const } },
        getFluentRuntime(mf)
      );
      return Object.assign(
        { LIST: { call: getListCall(rt), options: 'any' as const } },
        rt
      );
    };

    const src = source`
      msg = { $count ->
         [one] I-am dat cadouri { LIST($list, each: "dative") }.
        *[other] Le-am dat cadouri { LIST($list, each: "dative") }.
      }
    `;
    const res = compileFluent(src);
    const mf = new MessageFormat('ro', { runtime }, res);

    const list1 = ['Petre'];
    const msg1 = mf.getMessage('msg', {
      count: list1.length,
      list: list1
    });
    expect(msg1?.toString()).toBe('I-am dat cadouri lui Petre.');

    const list3 = ['Maria', 'Ileana', 'Petre'];
    const msg3 = mf.getMessage('msg', {
      count: list3.length,
      list: list3
    });
    expect(msg3?.toString()).toBe(
      'Le-am dat cadouri Mariei, Ilenei și lui Petre.'
    );
  });
});

describe('Neighbouring text transformations (unicode-org/message-format-wg#160)', () => {
  function hackyFixArticles(
    locales: string[],
    msg: ResolvedMessage | undefined
  ) {
    if (locales[0] !== 'en') throw new Error('Only English supported');
    if (!msg) return;
    const articly = /(^|\s)(a|an|A|An)(\W*$)/;
    const vowely =
      /^\W*(?:11|18|8|a|e(?![uw])|heir|herb|hon|hour|i|o(?!n[ce])|u[bcdfgklmprstvxz](?![aeiou])|un(?!i))/i;
    const wordy = msg.value.filter(part => /\w/.test(String(part.value)));
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
    qux = { $foo } foo and a {"..."} { $other }
  `;
  const res = compileFluent(src);
  const mf = new MessageFormat('en', { runtime: getFluentRuntime }, res);

  test('Match, no change', () => {
    const msg = mf.getMessage('foo', { foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], msg);
    expect(msg).toEqual({
      type: 'message',
      value: [
        { type: 'literal', value: 'A ' },
        { type: 'value', source: '$foo', value: 'foo' },
        { type: 'literal', value: ' and an ' },
        { type: 'value', source: '$other', value: 'other' }
      ]
    });
  });

  test('Match, changed', () => {
    const msg = mf.getMessage('foo', { foo: 'other', other: 'foo' });
    hackyFixArticles(['en'], msg);
    expect(msg).toEqual({
      type: 'message',
      value: [
        { type: 'literal', value: 'An ' },
        { type: 'value', source: '$foo', value: 'other' },
        { type: 'literal', value: ' and a ' },
        { type: 'value', source: '$other', value: 'foo' }
      ]
    });
  });

  test('No match, no change', () => {
    const msg = mf.getMessage('bar', { foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], msg);
    expect(msg).toEqual({
      type: 'message',
      value: [
        { type: 'literal', value: 'The ' },
        { type: 'value', source: '$foo', value: 'foo' },
        { type: 'literal', value: ' and lotsa ' },
        { type: 'value', source: '$other', value: 'other' }
      ]
    });
  });

  test('Articles across non-wordy content', () => {
    const msg = mf.getMessage('qux', { foo: 'An', other: 'other' });
    hackyFixArticles(['en'], msg);
    expect(msg).toEqual({
      type: 'message',
      value: [
        { type: 'value', source: '$foo', value: 'A' },
        { type: 'literal', value: ' foo and an ' },
        { type: 'literal', value: '...' },
        { type: 'literal', value: ' ' },
        { type: 'value', source: '$other', value: 'other' }
      ]
    });
  });
});
