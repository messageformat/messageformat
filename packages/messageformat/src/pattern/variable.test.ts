import { compileFluent } from '@messageformat/compiler';

import { Formattable, FormattableNumber, MessageFormat } from '../index';

describe('Formattable variables', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    const src = `msg = { $val }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    mf = new MessageFormat('en', null, res);
  });

  test('number', () => {
    expect(mf.formatToParts('msg', { val: 42 })).toMatchObject([
      { type: 'integer', value: '42', source: '$val' }
    ]);
  });

  test('Formattable(number)', () => {
    const val = new Formattable(null, 42);
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'dynamic', value: '42', source: '$val' }
    ]);
  });

  test('FormattableNumber(null, number, { options })', () => {
    const val: Formattable = new FormattableNumber(null, 42, {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'integer', value: '42', source: '$val' },
      { type: 'decimal', value: '.', source: '$val' },
      { type: 'fraction', value: '0', source: '$val' }
    ]);
  });

  test('FormattableNumber("en", BigInt, { options })', () => {
    const val = new FormattableNumber('en', BigInt(42), {
      options: { minimumFractionDigits: 2 }
    });
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'integer', value: '42', source: '$val' },
      { type: 'decimal', value: '.', source: '$val' },
      { type: 'fraction', value: '00', source: '$val' }
    ]);
  });
});
