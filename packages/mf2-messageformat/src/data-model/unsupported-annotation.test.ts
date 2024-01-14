import { MessageFormat } from '../index.js';

function resolve(
  source: string,
  params: Record<string, unknown>,
  errors: any[] = []
) {
  const mf = new MessageFormat(source);
  const onError = jest.fn();
  const res = mf.formatToParts(params, onError);
  expect(onError).toHaveBeenCalledTimes(errors.length);
  for (let i = 0; i < errors.length; ++i) {
    const err = onError.mock.calls[i][0];
    expect(err).toMatchObject(errors[i]);
  }
  return res;
}

describe('Reserved syntax', () => {
  test('empty', () => {
    const msg = resolve('{!}', {}, [{ type: 'unsupported-annotation' }]);
    expect(msg).toMatchObject([{ type: 'fallback', source: '!' }]);
  });

  test('argument', () => {
    const msg = resolve('{$foo ~bar}', { foo: 42 }, [
      { type: 'unsupported-annotation' }
    ]);
    expect(msg).toMatchObject([{ type: 'fallback', source: '$foo' }]);
  });

  test('attribute', () => {
    const msg = resolve('{%bar @foo}', {}, [
      { type: 'unsupported-annotation' }
    ]);
    expect(msg).toMatchObject([{ type: 'fallback', source: '%' }]);
  });

  test('old markup syntax', () => {
    const msg = resolve('{+open}', {}, [{ type: 'unsupported-annotation' }]);
    expect(msg).toMatchObject([{ type: 'fallback', source: '+' }]);
  });

  test('whitespace', () => {
    const msg = resolve('{ + one\ntwo\rthree four }', {}, [
      { type: 'unsupported-annotation' }
    ]);
    expect(msg).toMatchObject([{ type: 'fallback', source: '+' }]);
  });

  test('surrogates', () => {
    expect(() => new MessageFormat('{ %invalid \ud900 surrogate }')).toThrow();
  });
});
