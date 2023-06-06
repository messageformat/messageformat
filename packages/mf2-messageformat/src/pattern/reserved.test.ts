import { MessageFormat } from '../index';

function resolve(
  source: string,
  params: Record<string, unknown>,
  errors: any[] = []
) {
  const mf = new MessageFormat(source);
  const onError = jest.fn();
  const res = mf.resolveMessage(params, onError);
  expect(onError).toHaveBeenCalledTimes(errors.length);
  for (let i = 0; i < errors.length; ++i) {
    const err = onError.mock.calls[i][0];
    expect(err).toMatchObject(errors[i]);
  }
  return res;
}

describe('Reserved syntax', () => {
  test('empty', () => {
    const msg = resolve('{{!}}', {}, [{ type: 'reserved' }]);
    expect(msg).toMatchObject({
      type: 'message',
      value: [{ type: 'fallback', source: '!' }]
    });
  });

  test('argument', () => {
    const msg = resolve('{{$foo @bar}}', { foo: 42 }, [{ type: 'reserved' }]);
    expect(msg).toMatchObject({
      type: 'message',
      value: [{ type: 'fallback', source: '$foo' }]
    });
  });

  test('whitespace', () => {
    const msg = resolve('{{ # one\ntwo\rthree four }}', {}, [
      { type: 'reserved' }
    ]);
    expect(msg).toMatchObject({
      type: 'message',
      value: [{ type: 'fallback', source: '# one\ntwo\rthree four' }]
    });
  });

  test('surrogates', () => {
    const msg = resolve('{{ %invalid \ud900 surrogate }}', {}, [
      { type: 'parse-error' },
      { type: 'reserved' }
    ]);
    expect(msg).toMatchObject({
      type: 'message',
      value: [{ type: 'fallback', source: '%invalid \ud900 surrogate' }]
    });
  });
});
