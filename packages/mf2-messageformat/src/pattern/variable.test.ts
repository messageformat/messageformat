import { MessageFormat, MessageNumber, MessageValue } from '../index';

describe('MessageValue variables', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    mf = new MessageFormat('{{$val}}');
  });

  test('number', () => {
    expect(mf.resolveMessage({ val: 42 })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$val', value: 42 }]
    });
  });

  test('MessageValue(number)', () => {
    const val = new MessageValue(null, null, 42);
    expect(mf.resolveMessage({ val })).toMatchObject({
      type: 'message',
      value: [{ type: 'value', source: '$val', value: 42 }]
    });
  });

  test('MessageNumber(null, number, { options })', () => {
    const val: MessageValue = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.resolveMessage({ val })).toMatchObject({
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
    expect(mf.resolveMessage({ val })).toMatchObject({
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

describe('Variable paths', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    mf = new MessageFormat('{{$user.name}}', 'en');
  });

  test('top-level match', () => {
    expect(mf.resolveMessage({ 'user.name': 42 })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });

  test('scoped match', () => {
    expect(mf.resolveMessage({ user: { name: 42 } })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });

  test('top-level overrides scoped match', () => {
    expect(
      mf.resolveMessage({ user: { name: 13 }, 'user.name': 42 })
    ).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });
});
