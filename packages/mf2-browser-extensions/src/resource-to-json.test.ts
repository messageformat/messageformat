import { parseResource } from '@messageformat/resource';
import { resourceToExtensionJson } from './resource-to-json.js';
import { JsonFile } from './types.js';

test('resourceToExtensionJson', () => {
  const src = `\
one = {me$$age}
two = {message with {$var} and {|literal|}}

three = {{$foo :bar opt=baz}}
# comment
four =
  let $x = {$foo :number}
  let $y = {|literally|}
  {{$y} {$x}}

[ select.msg ]

one =
  let $x = {$foo :number}
  let $y = {$x}
  match {$z :foo}
  when 1 {{$y} {$x}}
  when * {none}

two =
  let $a = {$b}
  let $x = {$foo :number}
  let $y = {$x}
  match {$z :foo}
  when 1 {}
  when * {{$y}}
`;
  const res = parseResource(src, error => {
    throw error;
  });
  const json = resourceToExtensionJson(res, res);
  expect(json).toEqual<JsonFile>({
    one: { message: 'me$$$age' },
    two: {
      message: 'message with $var and literal',
      placeholders: { var: { content: '$1' } }
    },
    three: { message: '$foo', placeholders: { foo: { content: '$1' } } },
    four: {
      message: 'literally $foo',
      placeholders: { foo: { content: '$1' } }
    },
    select_msg_one: { message: 'none' },
    select_msg_two: {
      message: '$foo',
      placeholders: { foo: { content: '$2' } }
    }
  });
});
