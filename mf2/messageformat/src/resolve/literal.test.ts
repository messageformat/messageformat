import { MessageFormat } from '../index.ts';

function resolve(source: string, errors: any[] = []) {
  const mf = new MessageFormat(undefined, source);
  const onError = jest.fn();
  const res = mf.formatToParts(undefined, onError);
  expect(onError).toHaveBeenCalledTimes(errors.length);
  for (let i = 0; i < errors.length; ++i) {
    const err = onError.mock.calls[i][0];
    expect(err).toMatchObject(errors[i]);
  }
  return res;
}

describe('quoted literals', () => {
  test('simple', () => {
    const res = resolve('{|quoted literal|}');
    expect(res).toMatchObject([
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'string', value: 'quoted literal' },
      { type: 'bidiIsolation', value: '\u2069' }
    ]);
  });

  test('spaces, newlines and escapes', () => {
    const res = resolve('{| quoted \n \\\\\\|literal\\\\\\|\\{\\}|}');
    expect(res).toMatchObject([
      { type: 'bidiIsolation', value: '\u2068' },
      { type: 'string', value: ' quoted \n \\|literal\\|{}' },
      { type: 'bidiIsolation', value: '\u2069' }
    ]);
  });
});

describe('unquoted numbers', () => {
  for (const value of [
    '0',
    '42',
    '2.5',
    '-1',
    '-0.999',
    '1e3',
    '0.4E+5',
    '11.1e-1'
  ]) {
    test(value, () => {
      const res = resolve(`{${value}}`);
      expect(res).toMatchObject([
        { type: 'bidiIsolation', value: '\u2068' },
        { type: 'string', value },
        { type: 'bidiIsolation', value: '\u2069' }
      ]);
    });
  }
});
