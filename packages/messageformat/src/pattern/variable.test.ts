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
    expect(mf.getMessage('res', 'msg', { val: 42 })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$val', value: 42 }]
    });
  });

  test('MessageValue(number)', () => {
    const val = new MessageValue(MessageValue.type, null, 42);
    expect(mf.getMessage('res', 'msg', { val })).toMatchObject({
      type: 'message',
      value: [{ type: 'value', source: '$val', value: 42 }]
    });
  });

  test('MessageNumber(null, number, { options })', () => {
    const val: MessageValue = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.getMessage('res', 'msg', { val })).toMatchObject({
      type: 'message',
      value: [
        {
          type: 'number',
          source: '$val',
          options: { minimumFractionDigits: 1 },
          value: 42
        }
      ]
    });
  });

  test('MessageNumber("en", BigInt, { options })', () => {
    const val = new MessageNumber('en', BigInt(42), {
      options: { minimumFractionDigits: 2 }
    });
    expect(mf.getMessage('res', 'msg', { val })).toMatchObject({
      type: 'message',
      value: [
        {
          type: 'number',
          source: '$val',
          options: { minimumFractionDigits: 2 },
          value: BigInt(42)
        }
      ]
    });
  });
});
