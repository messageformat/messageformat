import { MessageFormat } from '../index.js';

describe('fractionDigits', () => {
  for (const fd of [0, 2, 'auto' as const]) {
    test(`fractionDigits=${fd}`, () => {
      const mf = new MessageFormat(
        'en',
        `{42 :currency currency=EUR fractionDigits=${fd}}`
      );
      const nf = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: fd === 'auto' ? undefined : fd,
        maximumFractionDigits: fd === 'auto' ? undefined : fd
      });
      expect(mf.format()).toEqual(nf.format(42));
      expect(mf.formatToParts()).toMatchObject([
        { parts: nf.formatToParts(42) }
      ]);
    });
  }
});

describe('currencyDisplay', () => {
  for (const cd of [
    'narrowSymbol',
    'symbol',
    'name',
    'code',
    'never'
  ] as const) {
    test(`currencyDisplay=${cd}`, () => {
      const mf = new MessageFormat(
        'en',
        `{42 :currency currency=EUR currencyDisplay=${cd}}`
      );
      const nf = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'EUR',
        currencyDisplay: cd === 'never' ? undefined : cd
      });
      const onError = jest.fn();
      expect(mf.format(undefined, onError)).toEqual(nf.format(42));
      expect(mf.formatToParts(undefined, onError)).toMatchObject([
        { parts: nf.formatToParts(42) }
      ]);
      if (cd === 'never') {
        expect(onError.mock.calls).toMatchObject([
          [{ type: 'unsupported-operation' }],
          [{ type: 'unsupported-operation' }]
        ]);
      } else {
        expect(onError.mock.calls).toMatchObject([]);
      }
    });
  }
});

test('selection', () => {
  const mf = new MessageFormat(
    'en',
    '.local $n = {42 :currency currency=EUR} .match $n 42 {{exact}} * {{other}}'
  );
  const onError = jest.fn();
  expect(mf.format(undefined, onError)).toEqual('other');
  expect(onError.mock.calls).toMatchObject([[{ type: 'bad-selector' }]]);
});

describe('complex operand', () => {
  test(':currency result', () => {
    const mf = new MessageFormat(
      'en',
      '.local $n = {-42 :currency currency=USD trailingZeroDisplay=stripIfInteger} {{{$n :currency currencySign=accounting}}}'
    );
    const nf = new Intl.NumberFormat('en', {
      style: 'currency',
      currencySign: 'accounting',
      // @ts-expect-error TS doesn't know about trailingZeroDisplay
      trailingZeroDisplay: 'stripIfInteger',
      currency: 'USD'
    });
    expect(mf.format()).toEqual(nf.format(-42));
    expect(mf.formatToParts()).toMatchObject([
      { parts: nf.formatToParts(-42) }
    ]);
  });

  test('external variable', () => {
    const mf = new MessageFormat('en', '{$n :currency}');
    const nf = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'EUR'
    });
    const n = { valueOf: () => 42, options: { currency: 'EUR' } };
    expect(mf.format({ n })).toEqual(nf.format(42));
    expect(mf.formatToParts({ n })).toMatchObject([
      { parts: nf.formatToParts(42) }
    ]);
  });
});
