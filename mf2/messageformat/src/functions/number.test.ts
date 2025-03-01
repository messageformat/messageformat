import { MessageFormat } from '../index.js';

test('soft fail for integer options', () => {
  const mf = new MessageFormat('en', '{42 :number minimumFractionDigits=foo}');
  const onError = jest.fn();
  expect(mf.format(undefined, onError)).toEqual('42');
  expect(onError.mock.calls).toMatchObject([[{ type: 'bad-option' }]]);
});

test('selection', () => {
  const mf = new MessageFormat(
    'en',
    '.local $exact = {exact} .local $n = {42 :number select=$exact} .match $n 42 {{exact}} * {{other}}'
  );
  const onError = jest.fn();
  expect(mf.format(undefined, onError)).toEqual('other');
  expect(onError.mock.calls).toMatchObject([
    [{ type: 'bad-option' }],
    [{ type: 'bad-selector' }]
  ]);
});
