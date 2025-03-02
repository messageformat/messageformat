import { MessageFormat } from '../index.js';
import { unit } from './unit.js';

test('selection', () => {
  const mf = new MessageFormat(
    'en',
    '.local $n = {42 :unit unit=meter} .match $n 42 {{exact}} * {{other}}',
    { functions: { unit } }
  );
  const onError = jest.fn();
  expect(mf.format(undefined, onError)).toEqual('other');
  expect(onError.mock.calls).toMatchObject([[{ type: 'bad-selector' }]]);
});

describe('complex operand', () => {
  test(':currency result', () => {
    const mf = new MessageFormat(
      'en',
      '.local $n = {42 :unit unit=meter trailingZeroDisplay=stripIfInteger} {{{$n :unit signDisplay=always}}}',
      { functions: { unit } }
    );
    const nf = new Intl.NumberFormat('en', {
      signDisplay: 'always',
      style: 'unit',
      // @ts-expect-error TS doesn't know about trailingZeroDisplay
      trailingZeroDisplay: 'stripIfInteger',
      unit: 'meter'
    });
    expect(mf.format()).toEqual(nf.format(42));
    expect(mf.formatToParts()).toMatchObject([{ parts: nf.formatToParts(42) }]);
  });

  test('external variable', () => {
    const mf = new MessageFormat('en', '{$n :unit}', { functions: { unit } });
    const nf = new Intl.NumberFormat('en', { style: 'unit', unit: 'meter' });
    const n = { valueOf: () => 42, options: { unit: 'meter' } };
    expect(mf.format({ n })).toEqual(nf.format(42));
    expect(mf.formatToParts({ n })).toMatchObject([
      { parts: nf.formatToParts(42) }
    ]);
  });
});
