import { MessageFormat } from '../index';

function resolve(source: string, errors: any[] = []) {
  const mf = new MessageFormat(source);
  const onError = jest.fn();
  const res = mf.resolveMessage(undefined, onError);
  expect(onError).toHaveBeenCalledTimes(errors.length);
  for (let i = 0; i < errors.length; ++i) {
    const err = onError.mock.calls[i][0];
    expect(err).toMatchObject(errors[i]);
  }
  return res;
}

describe('quoted literals', () => {
  test('simple', () => {
    const res = resolve('{{|quoted literal|}}');
    expect(res).toMatchObject({
      type: 'message',
      value: [{ type: 'literal', value: 'quoted literal' }]
    });
  });

  test('spaces, newlines and escapes', () => {
    const res = resolve('{{| quoted \n \\\\\\|literal\\\\\\||}}');
    expect(res).toMatchObject({
      type: 'message',
      value: [{ type: 'literal', value: ' quoted \n \\|literal\\|' }]
    });
  });

  test('invalid escapes', () => {
    const res = resolve('{{|quoted \\}\\{iteral|}}', [
      { type: 'bad-escape' },
      { type: 'bad-escape' }
    ]);
    expect(res).toMatchObject({
      type: 'message',
      value: [{ type: 'literal', value: 'quoted \\}\\{iteral' }]
    });
  });
});
