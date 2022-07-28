/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * The test cases included in this file have been extracted from the
 * @fluent/bundle 0.16.1 test files available at:
 *
 * https://github.com/projectfluent/fluent.js/tree/5ad594649a/fluent-bundle/test
 *
 * Those tests are published with the following license:
 *
 *     Copyright 2013 Mozilla Foundation and others
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

import * as Fluent from '@fluent/syntax';
import { source } from '@messageformat/test-utils';
import { MessageFormat, validate } from 'messageformat';
import { compileFluentResource, compileFluentResourceData } from './index';
import { resourceToFluent } from './resource-to-fluent';

type TestCase = {
  locale?: string;
  options?: Record<string, boolean | string>;
  src: string;
  tests: {
    msg: string;
    scope?: Record<string, string | number>;
    exp: string | RegExp;
    only?: boolean;
  }[];
};

const testCases: Record<string, TestCase> = {
  Attributes: {
    src: source`
      foo = Foo
          .attr = Foo Attribute
      bar = { foo } Bar
          .attr = Bar Attribute
      qux = { bar } Qux
          .attr = { qux } Attribute
      zig =
          .attr = { "a" ->
                      [a] A
                      *[b] B
                  }
      ref-foo = { foo.attr }
      ref-bar = { bar.attr }
      ref-qux = { qux.attr }
      ref-zig = { zig.attr }
    `,
    tests: [
      { msg: 'foo', exp: 'Foo' },
      { msg: 'bar', exp: 'Foo Bar' },
      { msg: 'qux', exp: 'Foo Bar Qux' },
      { msg: 'ref-foo', exp: 'Foo Attribute' },
      { msg: 'foo.attr', exp: 'Foo Attribute' },
      { msg: 'ref-bar', exp: 'Bar Attribute' },
      { msg: 'bar.attr', exp: 'Bar Attribute' },
      { msg: 'ref-qux', exp: 'Foo Bar Qux Attribute' },
      { msg: 'qux.attr', exp: 'Foo Bar Qux Attribute' },
      { msg: 'ref-zig', exp: 'A' },
      { msg: 'zig.attr', exp: 'A' }
    ]
  },

  'Built-in functions: NUMBER': {
    src: source`
      num-bare = { NUMBER($arg) }
      num-fraction-valid = { NUMBER($arg, minimumFractionDigits: 1) }
      num-fraction-bad = { NUMBER($arg, minimumFractionDigits: "oops") }
      num-style = { NUMBER($arg, style: "percent") }
      num-currency = { NUMBER($arg, style: "currency", currency: "EUR") }
      num-unknown = { NUMBER($arg, unknown: "unknown") }
    `,
    tests: [
      { msg: 'num-bare', scope: { arg: 1234 }, exp: '1,234' },
      { msg: 'num-fraction-valid', scope: { arg: 1234 }, exp: '1,234.0' },
      { msg: 'num-fraction-bad', scope: { arg: 1234 }, exp: '1234' },
      { msg: 'num-style', scope: { arg: 1234 }, exp: '123,400%' },
      { msg: 'num-currency', scope: { arg: 1234 }, exp: '€1,234.00' },
      { msg: 'num-unknown', scope: { arg: 1234 }, exp: '1,234' }
    ]
  },

  'Literals as selectors': {
    src: source`
      foo = { "a" ->
          [a] A
         *[b] B
      }
      bar = { "c" ->
          [a] A
         *[b] B
      }
      baz = { 0 ->
          [0] A
         *[1] B
      }
      qux = { 2 ->
          [0] A
         *[1] B
      }
      zig = { 1 ->
          [one] A
         *[other] B
      }
    `,
    tests: [
      { msg: 'foo', exp: 'A' },
      { msg: 'bar', exp: 'B' },
      { msg: 'baz', exp: 'A' },
      { msg: 'qux', exp: 'B' },
      { msg: 'zig', exp: 'A' }
    ]
  },

  'Parameterized term attributes': {
    src: source`
      -ship = Ship
          .gender = {$style ->
             *[traditional] neuter
              [chicago] feminine
          }
      ref-attr = {-ship.gender ->
         *[masculine] He
          [feminine] She
          [neuter] It
      }
      call-attr-no-args = {-ship.gender() ->
         *[masculine] He
          [feminine] She
          [neuter] It
      }
      call-attr-with-expected-arg = {-ship.gender(style: "chicago") ->
         *[masculine] He
          [feminine] She
          [neuter] It
      }
      call-attr-with-other-arg = {-ship.gender(other: 3) ->
         *[masculine] He
          [feminine] She
          [neuter] It
      }
    `,
    tests: [
      { msg: 'ref-attr', exp: 'It' },
      { msg: 'ref-attr', scope: { style: 'chicago' }, exp: 'It' },
      { msg: 'call-attr-no-args', exp: 'It' },
      { msg: 'call-attr-no-args', scope: { style: 'chicago' }, exp: 'It' },
      { msg: 'call-attr-with-expected-arg', exp: 'She' },
      {
        msg: 'call-attr-with-expected-arg',
        scope: { style: 'chicago' },
        exp: 'She'
      },
      { msg: 'call-attr-with-other-arg', exp: 'It' },
      {
        msg: 'call-attr-with-other-arg',
        scope: { style: 'chicago' },
        exp: 'It'
      }
    ]
  },

  'Passing arguments to terms': {
    src: source`
      -foo = Foo {$arg}
      ref-foo = {-foo}
      call-foo-no-args = {-foo()}
      call-foo-with-expected-arg = {-foo(arg: 1)}
      call-foo-with-other-arg = {-foo(other: 3)}
    `,
    tests: [
      { msg: '-foo', scope: { arg: 3 }, exp: 'Foo 3' }, // Fluent: 'Foo {$arg}'
      { msg: '-foo', scope: {}, exp: 'Foo {$arg}' },
      { msg: 'ref-foo', exp: 'Foo {$arg}' },
      { msg: 'call-foo-no-args', scope: { arg: 3 }, exp: 'Foo {$arg}' },
      { msg: 'call-foo-with-expected-arg', scope: { arg: 3 }, exp: 'Foo 1' },
      { msg: 'call-foo-with-other-arg', exp: 'Foo {$arg}' },
      { msg: 'call-foo-with-other-arg', scope: { arg: 3 }, exp: 'Foo {$arg}' }
    ]
  },

  'Select expressions': {
    src: source`
        select = {$selector ->
            [a] A
           *[b] B
        }
        number = {$selector ->
            [0] A
           *[1] B
        }
        plural = {$selector ->
            [one] A
           *[other] B
        }
        default = {$selector ->
            [one] A
           *[default] D
        }
    `,
    tests: [
      { msg: 'select', scope: {}, exp: 'B' },
      { msg: 'select', scope: { selector: 'a' }, exp: 'A' },
      { msg: 'select', scope: { selector: 'b' }, exp: 'B' },
      { msg: 'select', scope: { selector: 'c' }, exp: 'B' },
      { msg: 'number', scope: {}, exp: 'B' },
      { msg: 'number', scope: { selector: 0 }, exp: 'A' },
      { msg: 'number', scope: { selector: 1 }, exp: 'B' },
      { msg: 'number', scope: { selector: 2 }, exp: 'B' },
      { msg: 'plural', scope: {}, exp: 'B' },
      { msg: 'plural', scope: { selector: 1 }, exp: 'A' },
      { msg: 'plural', scope: { selector: 2 }, exp: 'B' },
      { msg: 'plural', scope: { selector: 'one' }, exp: 'A' },
      { msg: 'default', scope: {}, exp: 'D' },
      { msg: 'default', scope: { selector: 1 }, exp: 'A' },
      { msg: 'default', scope: { selector: 2 }, exp: 'D' },
      { msg: 'default', scope: { selector: 'one' }, exp: 'A' }
    ]
  },

  'Variables in values': {
    src: source`
      foo = Foo { $num }
      bar = { foo }
      baz =
          .attr = Baz Attribute { $num }
      qux = { "a" ->
          *[a]     Baz Variant A { $num }
      }
      zig = { $arg }
    `,
    tests: [
      { msg: 'foo', scope: { num: 3 }, exp: 'Foo 3' },
      { msg: 'bar', scope: { num: 3 }, exp: 'Foo {$num}' },
      { msg: 'baz.attr', scope: { num: 3 }, exp: 'Baz Attribute 3' },
      { msg: 'qux', scope: { num: 3 }, exp: 'Baz Variant A 3' },
      { msg: 'zig', scope: { arg: 'Argument' }, exp: 'Argument' }
    ]
  },

  'Variables elsewhere': {
    src: source`
      foo = { $num ->
        *[3] Foo
      }
      bar = { NUMBER($num) }
    `,
    tests: [
      { msg: 'foo', scope: { num: 3 }, exp: 'Foo' },
      { msg: 'bar', scope: { num: 3 }, exp: '3' }
    ]
  }
};

for (const [title, { locale = 'en', src, tests }] of Object.entries(
  testCases
)) {
  describe(title, () => {
    const data = compileFluentResourceData(src).data;
    const res = compileFluentResource(data, locale);

    test('validate', () => {
      for (const [id, mf] of res) {
        const { runtime } = mf.resolvedOptions();
        validate(data.get(id)!, runtime);
      }
    });

    for (const { msg, scope, exp, only } of tests) {
      let name = msg;
      if (scope) {
        const opt = Object.entries(scope).map(
          ([key, value]) => `${key}: ${value}`
        );
        name = `[${opt.join(', ')}] ${msg}`;
      }

      const _test = only ? test.only : test;
      _test(name, () => {
        const str = res.get(msg)?.resolveMessage(scope)?.toString();
        if (exp instanceof RegExp) expect(str).toMatch(exp);
        else expect(str).toBe(exp);
      });
    }

    test('resourceToFluent', () => {
      const template = Fluent.parse(src, { withSpans: false });
      const res = resourceToFluent(data, template);

      class FixExpected extends Fluent.Transformer {
        // MF2 uses first-match selection, so default variants will be last
        visitSelectExpression(node: Fluent.SelectExpression) {
          node.variants.sort((a, b) => (a.default ? 1 : b.default ? -1 : 0));
          return this.genericVisit(node);
        }

        // Consider { -foo() } as { -foo }
        visitCallArguments(node: Fluent.CallArguments) {
          return node.named.length === 0 && node.positional.length === 0
            ? (null as unknown as undefined)
            : this.genericVisit(node);
        }
      }
      new FixExpected().visit(template);

      expect(res.equals(template)).toBe(true);
    });
  });
}

describe('getMessage', () => {
  describe('parts', () => {
    const src = source`
      foo = Foo { $num }
      bar = { foo }
      sel = {$selector ->
          [a] A
         *[b] B
      }
    `;

    let res: Map<string, MessageFormat>;
    beforeAll(() => {
      res = compileFluentResource(src);
    });

    test('defined formatted variable', () => {
      const foo = res.get('foo')?.resolveMessage({ num: 42 });
      expect(foo).toEqual({
        type: 'message',
        value: [
          { type: 'literal', value: 'Foo ' },
          { source: '$num', type: 'number', value: 42 }
        ]
      });
    });

    test('undefined formatted variable', () => {
      const foo = res.get('foo')?.resolveMessage();
      expect(foo).toEqual({
        type: 'message',
        value: [
          { type: 'literal', value: 'Foo ' },
          { type: 'fallback', source: '$num', value: undefined }
        ]
      });
    });

    test('message reference', () => {
      const bar = res.get('bar')?.resolveMessage({ num: 42 });
      expect(bar).toEqual({
        type: 'message',
        value: [
          {
            type: 'message',
            source: 'foo :MESSAGE',
            value: [
              { type: 'literal', value: 'Foo ' },
              { type: 'fallback', source: '$num', value: undefined }
            ]
          }
        ]
      });
    });

    test('defined selector', () => {
      const sel = res.get('sel')?.resolveMessage({ selector: 'a' });
      expect(sel).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'A' }]
      });
    });

    test('undefined selector', () => {
      const sel = res.get('sel')?.resolveMessage();
      expect(sel).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'B' }]
      });
    });
  });

  describe('comments', () => {
    const src = source`
      ### Resource comment

      ## Group 1

      # First message
      foo = Foo { $num }
      bar = Bar

      ## Group 2

      # Discarded

      # Other message
      qux = Qux

      ### Other resource comment
    `;

    let res: Map<string, MessageFormat>;
    beforeAll(() => {
      res = compileFluentResource(src, 'en');
    });

    test('Data model comments', () => {
      const { comments, data } = compileFluentResourceData(src);
      expect(comments).toBe('Resource comment\n\nOther resource comment');
      expect(Array.from(data.entries())).toEqual([
        [
          'foo',
          {
            type: 'message',
            comment: 'Group 1\n\nFirst message',
            declarations: [],
            pattern: {
              body: [
                { type: 'text', value: 'Foo ' },
                { type: 'variable', name: 'num' }
              ]
            }
          }
        ],
        [
          'bar',
          {
            type: 'message',
            comment: 'Group 1',
            declarations: [],
            pattern: { body: [{ type: 'text', value: 'Bar' }] }
          }
        ],
        [
          'qux',
          {
            type: 'message',
            comment: 'Group 2\n\nOther message',
            declarations: [],
            pattern: { body: [{ type: 'text', value: 'Qux' }] }
          }
        ]
      ]);
    });

    test('foo', () => {
      const foo = res.get('foo')?.resolveMessage({ num: 42 });
      expect(foo).toEqual({
        type: 'message',
        value: [
          { type: 'literal', value: 'Foo ' },
          { type: 'number', source: '$num', value: 42 }
        ]
      });
    });

    test('bar', () => {
      const bar = res.get('bar')?.resolveMessage();
      expect(bar).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'Bar' }]
      });
    });

    test('qux', () => {
      const qux = res.get('qux')?.resolveMessage();
      expect(qux).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'Qux' }]
      });
    });
  });

  describe('Detect select cases', () => {
    const src = source`
      case = {$case ->
         [allative] ALL
         [genitive] GEN
        *[nominative] NOM
      }
      gender = {$gender ->
         [feminine] F
         [masculine] M
        *[neuter] N
      }
      plural = {$num ->
         [0] Zero
        *[other] Other
      }
    `;

    let res: Map<string, MessageFormat>;
    beforeAll(() => {
      res = compileFluentResource(src, 'en');
    });

    test('case with match', () => {
      const msg = res.get('case')?.resolveMessage({ case: 'genitive' });
      expect(msg).toEqual({
        type: 'message',
        meta: { case: 'genitive' },
        value: [{ type: 'literal', value: 'GEN' }]
      });
    });

    test('case with fallback', () => {
      const msg = res.get('case')?.resolveMessage({ case: 'oblique' });
      expect(msg).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'NOM' }]
      });
    });

    test('gender with match', () => {
      const msg = res.get('gender')?.resolveMessage({ gender: 'feminine' });
      expect(msg).toEqual({
        type: 'message',
        meta: { gender: 'feminine' },
        value: [{ type: 'literal', value: 'F' }]
      });
    });

    test('gender with fallback', () => {
      const msg = res.get('gender')?.resolveMessage();
      expect(msg).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'N' }]
      });
    });

    test('plural with match', () => {
      const msg = res.get('plural')?.resolveMessage({ num: 2 });
      expect(msg).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'Other' }]
      });
    });

    test('plural with fallback', () => {
      const msg = res.get('plural')?.resolveMessage({ num: 1 });
      expect(msg).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'Other' }]
      });
    });

    test('plural with non-plural input', () => {
      const msg = res.get('plural')?.resolveMessage({ num: 'NaN' });
      expect(msg).toEqual({
        type: 'message',
        value: [{ type: 'literal', value: 'Other' }]
      });
    });
  });
});
