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
import { PatternMessage, SelectMessage, validate } from 'messageformat';
import { fluentToResource, fluentToResourceData } from './index.js';
import { messageToFluent } from './message-to-fluent.js';
import { resourceToFluent } from './resource-to-fluent.js';

type TestCase = {
  locale?: string;
  options?: Record<string, boolean | string>;
  src: string;
  tests: {
    msg: string;
    attr?: string;
    scope?: Record<string, string | number>;
    exp: string | RegExp;
    errors?: Array<string | RegExp>;
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
      { msg: 'foo', attr: 'attr', exp: 'Foo Attribute' },
      { msg: 'ref-bar', exp: 'Bar Attribute' },
      { msg: 'bar', attr: 'attr', exp: 'Bar Attribute' },
      { msg: 'ref-qux', exp: 'Foo Bar Qux Attribute' },
      { msg: 'qux', attr: 'attr', exp: 'Foo Bar Qux Attribute' },
      { msg: 'ref-zig', exp: 'A' },
      { msg: 'zig', attr: 'attr', exp: 'A' }
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
      {
        msg: 'num-fraction-bad',
        scope: { arg: 1234 },
        exp: '{$arg}',
        errors: ['bad-option']
      },
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
      { msg: 'ref-attr', exp: 'It', errors: ['$style'] },
      {
        msg: 'ref-attr',
        scope: { style: 'chicago' },
        exp: 'It',
        errors: ['$style']
      },
      {
        msg: 'call-attr-no-args',
        exp: 'It',
        errors: ['$style']
      },
      {
        msg: 'call-attr-no-args',
        scope: { style: 'chicago' },
        exp: 'It',
        errors: ['$style']
      },
      { msg: 'call-attr-with-expected-arg', exp: 'She' },
      {
        msg: 'call-attr-with-expected-arg',
        scope: { style: 'chicago' },
        exp: 'She'
      },
      {
        msg: 'call-attr-with-other-arg',
        exp: 'It',
        errors: ['$style']
      },
      {
        msg: 'call-attr-with-other-arg',
        scope: { style: 'chicago' },
        exp: 'It',
        errors: ['$style']
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
      { msg: '-foo', scope: {}, exp: 'Foo {$arg}', errors: ['$arg'] },
      { msg: 'ref-foo', exp: 'Foo {$arg}', errors: ['$arg'] },
      {
        msg: 'call-foo-no-args',
        scope: { arg: 3 },
        exp: 'Foo {$arg}',
        errors: ['$arg']
      },
      { msg: 'call-foo-with-expected-arg', scope: { arg: 3 }, exp: 'Foo 1' },
      { msg: 'call-foo-with-other-arg', exp: 'Foo {$arg}', errors: ['$arg'] },
      {
        msg: 'call-foo-with-other-arg',
        scope: { arg: 3 },
        exp: 'Foo {$arg}',
        errors: ['$arg']
      }
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
      {
        msg: 'select',
        scope: {},
        exp: 'B',
        errors: ['$selector']
      },
      { msg: 'select', scope: { selector: 'a' }, exp: 'A' },
      { msg: 'select', scope: { selector: 'b' }, exp: 'B' },
      { msg: 'select', scope: { selector: 'c' }, exp: 'B' },
      {
        msg: 'number',
        scope: {},
        exp: 'B',
        errors: ['$selector']
      },
      { msg: 'number', scope: { selector: 0 }, exp: 'A' },
      { msg: 'number', scope: { selector: 1 }, exp: 'B' },
      { msg: 'number', scope: { selector: 2 }, exp: 'B' },
      {
        msg: 'plural',
        scope: {},
        exp: 'B',
        errors: ['$selector', 'bad-operand', 'bad-selector']
      },
      { msg: 'plural', scope: { selector: 1 }, exp: 'A' },
      { msg: 'plural', scope: { selector: 2 }, exp: 'B' },
      {
        msg: 'plural',
        scope: { selector: 'one' },
        exp: 'B',
        errors: ['bad-operand', 'bad-selector']
      },
      {
        msg: 'default',
        scope: {},
        exp: 'D',
        errors: ['$selector']
      },
      { msg: 'default', scope: { selector: 1 }, exp: 'D' },
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
      { msg: 'bar', scope: { num: 3 }, exp: 'Foo {$num}', errors: ['$num'] },
      { msg: 'baz', attr: 'attr', scope: { num: 3 }, exp: 'Baz Attribute 3' },
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
    const data = fluentToResourceData(src).data;
    const res = fluentToResource(data, locale);

    test('validate', () => {
      for (const [id, group] of res) {
        for (const [attr, mf] of group) {
          const { functions } = mf.resolvedOptions();
          // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
          const req = validate(data.get(id)?.get(attr ?? '')!, type => {
            throw new Error(`Validation failed: ${type}`);
          });
          for (const fn of req.functions) {
            if (typeof functions[fn] !== 'function') {
              throw new Error(`Unknown message function: ${fn}`);
            }
          }
        }
      }
    });

    for (const { msg, attr, scope, exp, errors, only } of tests) {
      let name = msg;
      if (scope) {
        const opt = Object.entries(scope).map(
          ([key, value]) => `${key}: ${value}`
        );
        name = `[${opt.join(', ')}] ${msg}`;
      }

      const test_ = only ? test.only : test;
      test_(name, () => {
        const onError = jest.fn();
        const mf = res.get(msg)!.get(attr ?? '');
        const str = mf!.format(scope, onError);
        if (exp instanceof RegExp) expect(str).toMatch(exp);
        else expect(str).toBe(exp);
        if (errors?.length) {
          //console.dir(mf?.resolvedOptions().message,{depth:null});
          //console.dir(onError.mock.calls, { depth: null });
          expect(onError).toHaveBeenCalledTimes(errors.length);
          for (let i = 0; i < errors.length; ++i) {
            const [err] = onError.mock.calls[i];
            const expErr = errors[i];
            if (typeof expErr === 'string' && !expErr.startsWith('$')) {
              expect(err.type).toBe(expErr);
            } else {
              expect(err.message).toMatch(expErr);
            }
          }
        } else {
          expect(onError).not.toHaveBeenCalled();
        }
      });
    }

    test('resourceToFluent', () => {
      const template = Fluent.parse(src, { withSpans: false });
      const res = resourceToFluent(data, template);

      class FixResult extends Fluent.Transformer {
        // When converting to MF2, number wrappers are added
        visitSelectExpression(node: Fluent.SelectExpression) {
          if (
            node.selector.type === 'FunctionReference' &&
            node.selector.id.name === 'NUMBER'
          ) {
            node.selector = node.selector.arguments.positional[0];
          }
          return this.genericVisit(node);
        }
      }
      new FixResult().visit(res);

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

describe('formatToParts', () => {
  describe('parts', () => {
    const src = source`
      foo = Foo { $num }
      bar = { foo }
      sel = {$selector ->
          [a] A
         *[b] B
      }
    `;

    const res = fluentToResource(src, 'en');

    test('defined formatted variable', () => {
      const foo = res.get('foo')?.get('')?.formatToParts({ num: 42 });
      expect(foo).toEqual([
        { type: 'literal', value: 'Foo ' },
        {
          type: 'number',
          source: '$num',
          locale: 'en',
          parts: [{ type: 'integer', value: '42' }]
        }
      ]);
    });

    test('undefined formatted variable', () => {
      const onError = jest.fn();
      const foo = res.get('foo')?.get('')?.formatToParts(undefined, onError);
      expect(foo).toEqual([
        { type: 'literal', value: 'Foo ' },
        { type: 'fallback', source: '$num' }
      ]);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    test('message reference', () => {
      const onError = jest.fn();
      const bar = res.get('bar')?.get('')?.formatToParts({ num: 42 }, onError);
      expect(bar).toMatchObject([
        {
          type: 'fluent-message',
          source: '|foo|',
          parts: [
            { type: 'literal', value: 'Foo ' },
            { type: 'fallback', source: '$num' }
          ]
        }
      ]);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    test('defined selector', () => {
      const sel = res.get('sel')?.get('')?.formatToParts({ selector: 'a' });
      expect(sel).toEqual([{ type: 'literal', value: 'A' }]);
    });

    test('undefined selector', () => {
      const onError = jest.fn();
      const sel = res.get('sel')?.get('')?.formatToParts(undefined, onError);
      expect(sel).toEqual([{ type: 'literal', value: 'B' }]);
      expect(onError).toHaveBeenCalledTimes(1);
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

    const res = fluentToResource(src, 'en');

    test('Data model comments', () => {
      const { comments, data } = fluentToResourceData(src);
      expect(comments).toBe('Resource comment\n\nOther resource comment');
      expect(
        Array.from(data.entries()).map(([k, v]) => [k, Array.from(v.entries())])
      ).toEqual([
        [
          'foo',
          [
            [
              '',
              {
                type: 'message',
                comment: 'Group 1\n\nFirst message',
                declarations: [],
                pattern: [
                  'Foo ',
                  { type: 'expression', arg: { type: 'variable', name: 'num' } }
                ]
              }
            ]
          ]
        ],
        [
          'bar',
          [
            [
              '',
              {
                type: 'message',
                comment: 'Group 1',
                declarations: [],
                pattern: ['Bar']
              }
            ]
          ]
        ],
        [
          'qux',
          [
            [
              '',
              {
                type: 'message',
                comment: 'Group 2\n\nOther message',
                declarations: [],
                pattern: ['Qux']
              }
            ]
          ]
        ]
      ]);
    });

    test('foo', () => {
      const foo = res.get('foo')?.get('')?.formatToParts({ num: 42 });
      expect(foo).toEqual([
        { type: 'literal', value: 'Foo ' },
        {
          type: 'number',
          source: '$num',
          locale: 'en',
          parts: [{ type: 'integer', value: '42' }]
        }
      ]);
    });

    test('bar', () => {
      const bar = res.get('bar')?.get('')?.formatToParts();
      expect(bar).toEqual([{ type: 'literal', value: 'Bar' }]);
    });

    test('qux', () => {
      const qux = res.get('qux')?.get('')?.formatToParts();
      expect(qux).toEqual([{ type: 'literal', value: 'Qux' }]);
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

    const res = fluentToResource(src, 'en');

    test('case with match', () => {
      const msg = res.get('case')?.get('')?.formatToParts({ case: 'genitive' });
      expect(msg).toEqual([{ type: 'literal', value: 'GEN' }]);
    });

    test('case with fallback', () => {
      const onError = jest.fn();
      const msg = res
        .get('case')
        ?.get('')
        ?.formatToParts({ case: 'oblique' }, onError);
      expect(msg).toEqual([{ type: 'literal', value: 'NOM' }]);
      expect(onError).not.toHaveBeenCalled();
    });

    test('gender with match', () => {
      const msg = res
        .get('gender')
        ?.get('')
        ?.formatToParts({ gender: 'feminine' });
      expect(msg).toEqual([{ type: 'literal', value: 'F' }]);
    });

    test('gender with fallback', () => {
      const onError = jest.fn();
      const msg = res.get('gender')?.get('')?.formatToParts(undefined, onError);
      expect(msg).toEqual([{ type: 'literal', value: 'N' }]);
      expect(onError.mock.calls.map(args => args[0].type)).toEqual([
        'unresolved-variable'
      ]);
    });

    test('plural with match', () => {
      const msg = res.get('plural')?.get('')?.formatToParts({ num: 2 });
      expect(msg).toEqual([{ type: 'literal', value: 'Other' }]);
    });

    test('plural with fallback', () => {
      const onError = jest.fn();
      const msg = res
        .get('plural')
        ?.get('')
        ?.formatToParts({ num: 1 }, onError);
      expect(msg).toEqual([{ type: 'literal', value: 'Other' }]);
      expect(onError).not.toHaveBeenCalled();
    });

    test('plural with non-plural input', () => {
      const onError = jest.fn();
      const msg = res
        .get('plural')
        ?.get('')
        ?.formatToParts({ num: 'NaN' }, onError);
      expect(msg).toEqual([{ type: 'literal', value: 'Other' }]);
      expect(onError.mock.calls.map(args => args[0].type)).toEqual([
        'bad-operand',
        'bad-selector'
      ]);
    });
  });
});

describe('fluentToResourceData', () => {
  const src = source`
    single = One {$num ->
       [0] Zero
      *[other] Other
    } selector.
    multi = Combine {$num ->
       [0] Zero
      *[other] Other
    } multiple {$gender ->
       [feminine] F
       [masculine] M
      *[neuter] N
    } selectors.
  `;

  const { data } = fluentToResourceData(src);

  test('Merge adjacent text elements for one selector', () => {
    const msg = data.get('single')?.get('') as SelectMessage;
    expect(msg.variants.map(v => v.value)).toMatchObject([
      ['One Zero selector.'],
      ['One Other selector.']
    ]);
  });

  test('Merge adjacent text elements for multiple selectors', () => {
    const msg = data.get('multi')?.get('') as SelectMessage;
    expect(msg.variants.map(v => v.value)).toMatchObject([
      ['Combine Zero multiple F selectors.'],
      ['Combine Zero multiple M selectors.'],
      ['Combine Zero multiple N selectors.'],
      ['Combine Other multiple F selectors.'],
      ['Combine Other multiple M selectors.'],
      ['Combine Other multiple N selectors.']
    ]);
  });

  test('Select catchall keys', () => {
    const msg = data.get('multi')?.get('') as SelectMessage;
    expect(msg.variants.map(v => v.keys)).toMatchObject([
      [
        { type: 'literal', value: '0' },
        { type: 'literal', value: 'feminine' }
      ],
      [
        { type: 'literal', value: '0' },
        { type: 'literal', value: 'masculine' }
      ],
      [
        { type: 'literal', value: '0' },
        { type: '*', value: 'neuter' }
      ],
      [
        { type: '*', value: 'other' },
        { type: 'literal', value: 'feminine' }
      ],
      [
        { type: '*', value: 'other' },
        { type: 'literal', value: 'masculine' }
      ],
      [
        { type: '*', value: 'other' },
        { type: '*', value: 'neuter' }
      ]
    ]);
  });

  test('round-trip', () => {
    const res = resourceToFluent(data);
    expect(Fluent.serialize(res, {})).toBe(source`
      single =
          { NUMBER($num) ->
              [0] One Zero selector.
             *[other] One Other selector.
          }
      multi =
          { NUMBER($num) ->
              [0]
                  { $gender ->
                      [feminine] Combine Zero multiple F selectors.
                      [masculine] Combine Zero multiple M selectors.
                     *[neuter] Combine Zero multiple N selectors.
                  }
             *[other]
                  { $gender ->
                      [feminine] Combine Other multiple F selectors.
                      [masculine] Combine Other multiple M selectors.
                     *[neuter] Combine Other multiple N selectors.
                  }
          }
    `);
  });
});

describe('messagetoFluent', () => {
  test('SelectMessage with one variant & local var selector', () => {
    const msg: SelectMessage = {
      type: 'select',
      declarations: [
        {
          type: 'local',
          name: 'local',
          value: {
            type: 'expression',
            arg: { type: 'variable', name: 'num' },
            annotation: { type: 'function', name: 'number' }
          }
        }
      ],
      selectors: [{ type: 'variable', name: 'local' }],
      variants: [
        {
          keys: [{ type: '*' }],
          value: ['X']
        }
      ]
    };
    const fm = messageToFluent(msg);
    expect(fm).toEqual({
      type: 'Pattern',
      elements: [
        {
          type: 'Placeable',
          expression: {
            type: 'SelectExpression',
            selector: {
              type: 'FunctionReference',
              id: { type: 'Identifier', name: 'NUMBER' },
              arguments: {
                type: 'CallArguments',
                positional: [
                  {
                    type: 'VariableReference',
                    id: { type: 'Identifier', name: 'num' }
                  }
                ],
                named: []
              }
            },
            variants: [
              {
                type: 'Variant',
                key: { type: 'Identifier', name: 'other' },
                value: {
                  type: 'Pattern',
                  elements: [{ type: 'TextElement', value: 'X' }]
                },
                default: true
              }
            ]
          }
        }
      ]
    });
  });

  test('Message & term references with local var operand', () => {
    const msg: PatternMessage = {
      type: 'message',
      declarations: [
        {
          type: 'local',
          name: 'local',
          value: {
            type: 'expression',
            arg: { type: 'literal', value: '-term' }
          }
        }
      ],
      pattern: [
        {
          type: 'expression',
          arg: { type: 'literal', value: 'msg' },
          annotation: { type: 'function', name: 'message' }
        },
        {
          type: 'expression',
          arg: { type: 'variable', name: 'local' },
          annotation: { type: 'function', name: 'message' }
        }
      ]
    };
    const fm = messageToFluent(msg);
    expect(fm).toEqual({
      type: 'Pattern',
      elements: [
        {
          type: 'Placeable',
          expression: {
            type: 'MessageReference',
            id: { type: 'Identifier', name: 'msg' },
            attribute: null
          }
        },
        {
          type: 'Placeable',
          expression: {
            type: 'TermReference',
            id: { type: 'Identifier', name: 'term' },
            attribute: null,
            arguments: null
          }
        }
      ]
    });
  });

  test('Message references with input var operand', () => {
    const msg: PatternMessage = {
      type: 'message',
      declarations: [],
      pattern: [
        {
          type: 'expression',
          arg: { type: 'variable', name: 'input' },
          annotation: { type: 'function', name: 'message' }
        }
      ]
    };
    expect(() => messageToFluent(msg)).toThrow(
      'Fluent message and term references must have a literal message identifier'
    );
  });
});
