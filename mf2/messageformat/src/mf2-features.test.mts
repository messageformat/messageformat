// deno-lint-ignore-file

import { fluentToResource } from '@messageformat/fluent';
import {
  getMF1Functions,
  mf1ToMessage,
  mf1ToMessageData
} from '@messageformat/icu-messageformat-1';
import { parse } from '@messageformat/parser';
import { source } from '~/test/utils/source.js';

import type {
  MessageFunctionContext,
  MessageValue
} from './functions/index.ts';
import {
  MessageBiDiIsolationPart,
  MessageExpressionPart,
  MessageFormat,
  MessageLiteralPart,
  SelectMessage
} from './index.ts';

describe('Plural Range Selectors & Range Formatters (unicode-org/message-format-wg#125)', () => {
  function range(
    { source, locales: [locale] }: MessageFunctionContext,
    options: Record<string, unknown>,
    input: unknown
  ): MessageValue {
    const { start, end } = input as { start: number; end: number };
    const value = `${start} - ${end}`;
    return {
      type: 'range',
      source,
      selectKey(keys) {
        if (locale !== 'nl') throw new Error('Only Dutch supported');
        const pr = new Intl.PluralRules(locale, options);
        const rc = pr.select(end);
        return keys.has(rc) ? rc : null;
      },
      toParts: () => [{ type: 'range', source, value }],
      toString: () => value
    };
  }

  test('input as { start, end } object', () => {
    const mf = new MessageFormat(
      'nl',
      source`
        .input {$range :range}
        .match $range
        one {{{$range} dag}}
        * {{{$range} dagen}}
      `,
      { functions: { range } }
    );

    const msg1 = mf.format({ range: { start: 0, end: 1 } });
    expect(msg1).toBe('0 - 1 dag');
    const parts1 = mf.formatToParts({ range: { start: 0, end: 1 } });
    expect(parts1).toEqual([
      { type: 'range', source: '$range', value: '0 - 1' },
      { type: 'literal', value: ' dag' }
    ]);

    const msg2 = mf.format({ range: { start: 1, end: 2 } });
    expect(msg2).toBe('1 - 2 dagen');
    const parts2 = mf.formatToParts({ range: { start: 1, end: 2 } });
    expect(parts2).toEqual([
      { type: 'range', source: '$range', value: '1 - 2' },
      { type: 'literal', value: ' dagen' }
    ]);
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
    const msg = mf1ToMessageData(parse(src)) as SelectMessage;
    expect(msg.selectors).toHaveLength(4);
    expect(msg.variants).toHaveLength(81);

    const mf = mf1ToMessage(msg, 'en');

    const none = mf.format({
      poolCount: 0,
      restaurantCount: 0,
      beachCount: 0,
      golfCount: 0
    });
    expect(none).toBe(
      'This all-inclusive resort includes no pools, no restaurants, no beaches and no golf courses.'
    );

    const one = mf.format({
      poolCount: 1,
      restaurantCount: 1,
      beachCount: 1,
      golfCount: 1
    });
    expect(one).toBe(
      'This all-inclusive resort includes 1 pool, 1 restaurant, 1 beach and 1 golf course.'
    );

    const two = mf.format({
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
    const msg = mf1ToMessageData(parse(src)) as SelectMessage;
    expect(msg.selectors).toHaveLength(6);
    expect(msg.variants).toHaveLength(64);

    const mf = new MessageFormat('en', msg, { functions: getMF1Functions() });

    const one = mf.format({
      N: 1,
      LIVE: String(undefined),
      TAG: 'foo',
      DAY: String(undefined),
      TIME: String(undefined),
      AREA: String(undefined),
      Q: String(undefined)
    });
    expect(one.replace(/\s+/g, ' ').trim()).toBe('Listing one foo item');

    const two = mf.format({
      N: 2,
      LIVE: true,
      TAG: 'foo',
      DAY: String(undefined),
      TIME: String(undefined),
      AREA: 'there',
      Q: '"bar"'
    });
    expect(two.replace(/\s+/g, ' ').trim()).toBe(
      'Listing 2 current and future foo items in there matching the query "bar"'
    );
  });

  test('Mozilla Common Voice activity (@stasm)', () => {
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
    const res = fluentToResource(src, 'en');

    const one = res.get('activity-needed-calculation-plural')?.get('')?.format({
      totalHours: 1,
      periodMonths: 1,
      people: 1,
      clipsPerDay: 1
    });
    expect(one).toBe(
      '1 hour is achievable in just over 1 month if 1 person record 1 clip a day.'
    );

    const two = res.get('activity-needed-calculation-plural')?.get('')?.format({
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
  const listFn =
    (each_?: Record<string, (locales: string[], value: string) => string>) =>
    (
      { locales, source }: MessageFunctionContext,
      options: Record<string, unknown>,
      input?: unknown
    ): MessageValue => {
      let list = Array.isArray(input)
        ? input.map(String)
        : input === undefined
          ? []
          : [String(input)];

      if (typeof options.each === 'string' && each_ && options.each in each_) {
        const each = each_[options.each];
        list = list.map(value => each(locales, value));
      }

      const lf = new Intl.ListFormat(locales, options);
      return {
        type: 'list',
        source,
        toParts: () =>
          lf.formatToParts(list).map(part => Object.assign(part, { source })),
        toString: () => lf.format(list)
      };
    };

  test('Intl.ListFormat, combine/flatten inputs (unicode-org/message-format-wg#36)', () => {
    const list = ['Motorcycle', 'Bus', 'Car'];
    const opt = { functions: { list: listFn() } };

    const mf1 = new MessageFormat('en', '{$list :list}', opt);
    expect(mf1.format({ list })).toBe('Motorcycle, Bus, and Car');

    const mf2 = new MessageFormat(
      'en',
      '{$list :list style=short type=conjunction}',
      opt
    );
    expect(mf2.format({ list })).toBe('Motorcycle, Bus, & Car');

    const mf3 = new MessageFormat(
      'en',
      '{$list :list style=long type=disjunction}',
      opt
    );
    expect(mf3.format({ list })).toBe('Motorcycle, Bus, or Car');
  });

  test('List formatting with grammatical inflection on each list item (unicode-org/message-format-wg#3)', () => {
    function dative(locales: string[], value: string) {
      if (locales[0] !== 'ro') throw new Error('Only Romanian supported');
      const data: Record<string, string> = {
        Maria: 'Mariei',
        Ileana: 'Ilenei',
        Petre: 'lui Petre'
      };
      return data[value] || value;
    }

    const mf = new MessageFormat(
      'ro',
      source`
        .input {$count :number}
        .match $count
        one {{I-am dat cadouri {$list :list each=dative}.}}
        * {{Le-am dat cadouri {$list :list each=dative}.}}
      `,
      { functions: { list: listFn({ dative }) } }
    );

    const msg1 = mf.format({ count: 1, list: ['Petre'] });
    expect(msg1).toBe('I-am dat cadouri lui Petre.');

    const msg3 = mf.format({ count: 3, list: ['Maria', 'Ileana', 'Petre'] });
    expect(msg3).toBe('Le-am dat cadouri Mariei, Ilenei și lui Petre.');
  });
});

describe('Neighbouring text transformations (unicode-org/message-format-wg#160)', () => {
  function hackyFixArticles(
    locales: string[],
    parts: Array<
      MessageExpressionPart | MessageLiteralPart | MessageBiDiIsolationPart
    >
  ) {
    if (locales[0] !== 'en') throw new Error('Only English supported');
    if (!parts) return;
    const articly = /(^|\s)(a|an|A|An)(\W*$)/;
    const vowely =
      /^\W*(?:11|18|8|a|e(?![uw])|heir|herb|hon|hour|i|o(?!n[ce])|u[bcdfgklmprstvxz](?![aeiou])|un(?!i))/i;
    const wordy = parts.filter(
      part => typeof part.value === 'string' && /\w/.test(part.value)
    );
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

  test('Match, no change', () => {
    const mf = new MessageFormat('en', 'A {$foo} and an {$other}');
    const parts = mf.formatToParts({ foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'A ' },
      { type: 'string', locale: 'en', source: '$foo', value: 'foo' },
      { type: 'literal', value: ' and an ' },
      { type: 'string', locale: 'en', source: '$other', value: 'other' }
    ]);
  });

  test('Match, changed', () => {
    const mf = new MessageFormat('en', 'A {$foo} and an {$other}');
    const parts = mf.formatToParts({ foo: 'other', other: 'foo' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'An ' },
      { type: 'string', locale: 'en', source: '$foo', value: 'other' },
      { type: 'literal', value: ' and a ' },
      { type: 'string', locale: 'en', source: '$other', value: 'foo' }
    ]);
  });

  test('No match, no change', () => {
    const mf = new MessageFormat('en', 'The {$foo} and lotsa {$other}');
    const parts = mf.formatToParts({ foo: 'foo', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'literal', value: 'The ' },
      { type: 'string', locale: 'en', source: '$foo', value: 'foo' },
      { type: 'literal', value: ' and lotsa ' },
      { type: 'string', locale: 'en', source: '$other', value: 'other' }
    ]);
  });

  test('Articles across non-wordy content', () => {
    const mf = new MessageFormat('en', '{$foo} foo and a {|...|} {$other}');
    const parts = mf.formatToParts({ foo: 'An', other: 'other' });
    hackyFixArticles(['en'], parts);
    expect(parts).toEqual([
      { type: 'string', locale: 'en', source: '$foo', value: 'A' },
      { type: 'literal', value: ' foo and an ' },
      { type: 'string', locale: 'en', source: '|...|', value: '...' },
      { type: 'literal', value: ' ' },
      { type: 'string', locale: 'en', source: '$other', value: 'other' }
    ]);
  });
});
