import { compileFluent } from '@messageformat/compiler';

import { MessageNumber, MessageFormat, MessageValue } from '../index';

describe('MessageValue variables', () => {
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

  test('MessageValue(number)', () => {
    const val = new MessageValue(null, 42);
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'dynamic', value: '42', source: '$val' }
    ]);
  });

  test('MessageNumber(null, number, { options })', () => {
    const val: MessageValue = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'integer', value: '42', source: '$val' },
      { type: 'decimal', value: '.', source: '$val' },
      { type: 'fraction', value: '0', source: '$val' }
    ]);
  });

  test('MessageNumber("en", BigInt, { options })', () => {
    const val = new MessageNumber('en', BigInt(42), {
      options: { minimumFractionDigits: 2 }
    });
    expect(mf.formatToParts('msg', { val })).toMatchObject([
      { type: 'integer', value: '42', source: '$val' },
      { type: 'decimal', value: '.', source: '$val' },
      { type: 'fraction', value: '00', source: '$val' }
    ]);
  });
});
