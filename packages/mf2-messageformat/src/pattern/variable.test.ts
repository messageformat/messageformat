import { compileFluent } from '@messageformat/compiler';

import {
  MessageFormat,
  MessageGroup,
  MessageNumber,
  MessageValue,
  VariableRef
} from '../index';

describe('MessageValue variables', () => {
  let mf: MessageFormat;
  beforeEach(() => {
    const src = `msg = { $val }`;
    const res = compileFluent(src);
    mf = new MessageFormat('en', null, res);
  });

  test('number', () => {
    expect(mf.getMessage('msg', { val: 42 })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$val', value: 42 }]
    });
  });

  test('MessageValue(number)', () => {
    const val = new MessageValue(MessageValue.type, null, 42);
    expect(mf.getMessage('msg', { val })).toMatchObject({
      type: 'message',
      value: [{ type: 'value', source: '$val', value: 42 }]
    });
  });

  test('MessageNumber(null, number, { options })', () => {
    const val: MessageValue = new MessageNumber(null, 42, {
      options: { minimumFractionDigits: 1 }
    });
    expect(mf.getMessage('msg', { val })).toMatchObject({
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
    expect(mf.getMessage('msg', { val })).toMatchObject({
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
    const res: MessageGroup<VariableRef> = {
      type: 'group',
      entries: {
        msg: {
          type: 'message',
          pattern: [{ type: 'variable', name: 'user.name' }]
        }
      }
    };
    mf = new MessageFormat('en', null, res);
  });

  test('top-level match', () => {
    expect(mf.getMessage('msg', { 'user.name': 42 })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });

  test('scoped match', () => {
    expect(mf.getMessage('msg', { user: { name: 42 } })).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });

  test('top-level overrides scoped match', () => {
    expect(
      mf.getMessage('msg', { user: { name: 13 }, 'user.name': 42 })
    ).toMatchObject({
      type: 'message',
      value: [{ type: 'number', source: '$user.name', value: 42 }]
    });
  });
});
