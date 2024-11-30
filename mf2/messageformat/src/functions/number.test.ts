import { MessageFormat } from '../index.ts';

test('soft fail for integer options', () => {
  const mf = new MessageFormat('en', '{42 :number minimumFractionDigits=foo}');
  const onError = jest.fn();
  expect(mf.format(undefined, onError)).toEqual('42');
  expect(onError.mock.calls).toMatchObject([[{ type: 'bad-option' }]]);
});
