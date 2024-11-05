import { MessageFormat } from '../index.js';

describe('variables', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    mf = new MessageFormat('en', '{$val}');
  });

  test('number', () => {
    expect(mf.format({ val: 42 })).toBe('42');
    expect(mf.formatToParts({ val: 42 })).toEqual([
      {
        type: 'number',
        source: '$val',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });

  test('bigint', () => {
    const val = BigInt(42);
    expect(mf.format({ val })).toBe('42');
    expect(mf.formatToParts({ val })).toEqual([
      {
        type: 'number',
        source: '$val',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });

  test('Number', () => {
    const val = new Number(42);
    expect(mf.format({ val })).toBe('42');
    expect(mf.formatToParts({ val })).toEqual([
      {
        type: 'number',
        source: '$val',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });

  test('wrapped number', () => {
    const val = { valueOf: () => BigInt(42) };
    expect(mf.formatToParts({ val })).toEqual([
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'unknown', source: '$val', value: val },
      { type: 'bidiIsolation', value: '\u2069' }
    ]);
  });

  test('Number with { options })', () => {
    const val = Object.assign(new Number(42), {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.format({ val })).toBe('42.0');
    expect(mf.formatToParts({ val })).toEqual([
      {
        type: 'number',
        source: '$val',
        dir: 'ltr',
        locale: 'en',
        parts: [
          { type: 'integer', value: '42' },
          { type: 'decimal', value: '.' },
          { type: 'fraction', value: '0' }
        ]
      }
    ]);
  });
});

describe('Variable paths', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    mf = new MessageFormat('en', '{$user.name}');
  });

  test('top-level match', () => {
    expect(mf.formatToParts({ 'user.name': 42 })).toEqual([
      {
        type: 'number',
        source: '$user.name',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });

  test('scoped match', () => {
    expect(mf.formatToParts({ user: { name: 42 } })).toEqual([
      {
        type: 'number',
        source: '$user.name',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });

  test('top-level overrides scoped match', () => {
    expect(mf.formatToParts({ user: { name: 13 }, 'user.name': 42 })).toEqual([
      {
        type: 'number',
        source: '$user.name',
        dir: 'ltr',
        locale: 'en',
        parts: [{ type: 'integer', value: '42' }]
      }
    ]);
  });
});
