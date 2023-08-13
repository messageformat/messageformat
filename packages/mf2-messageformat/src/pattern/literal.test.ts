import { MessageFormat } from '../index';

function resolve(source: string, errors: any[] = []) {
  const mf = new MessageFormat(source);
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
    const res = resolve('{{|quoted literal|}}');
    expect(res).toMatchObject([{ type: 'literal', value: 'quoted literal' }]);
  });

  test('spaces, newlines and escapes', () => {
    const res = resolve('{{| quoted \n \\\\\\|literal\\\\\\||}}');
    expect(res).toMatchObject([
      { type: 'literal', value: ' quoted \n \\|literal\\|' }
    ]);
  });

  test('invalid escapes', () => {
    expect(() => new MessageFormat('{{|quoted \\}iteral|}}')).toThrow();
    expect(() => new MessageFormat('{{|quoted \\{iteral|}}')).toThrow();
  });
});
