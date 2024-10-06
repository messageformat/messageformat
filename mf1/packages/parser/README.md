# @messageformat/parser

An AST parser for [ICU MessageFormat] strings – part of [messageformat].

The `parse(src, [options])` function takes two parameters, first the
string to be parsed, and a second optional parameter `options`, an object with
the following possible keys:

- `cardinal` and `ordinal` – Arrays of valid plural categories for the current
  locale, used to validate `plural` and `selectordinal` keys. If these are
  missing or set to false, the full set of valid [Unicode CLDR] keys is used:
  `'zero', 'one', 'two', 'few', 'many', 'other'`. To disable this check, pass in
  an empty array.

- `strict` – By default, the parsing applies a few relaxations to the ICU
  MessageFormat spec. Setting `strict: true` will disable these relaxations:
  - The `argType` of `simpleArg` formatting functions will be restricted to the
    set of `number`, `date`, `time`, `spellout`, `ordinal`, and `duration`,
    rather than accepting any lower-case identifier that does not start with a
    number.
  - The optional `argStyle` of `simpleArg` formatting functions will not be
    parsed as any other text, but instead as the spec requires: "In
    argStyleText, every single ASCII apostrophe begins and ends quoted literal
    text, and unquoted {curly braces} must occur in matched pairs."
  - Inside a `plural` or `selectordinal` statement, a pound symbol (`#`) is
    replaced with the input number. By default, `#` is also parsed as a special
    character in nested statements too, and can be escaped using apostrophes
    (`'#'`). In strict mode `#` will be parsed as a special character only
    directly inside a `plural` or `selectordinal` statement. Outside those, `#`
    and `'#'` will be parsed as literal text.

The parser only supports the default `DOUBLE_OPTIONAL` [apostrophe mode], in
which a single apostrophe only starts quoted literal text if it immediately
precedes a curly brace `{}`, or a pound symbol `#` if inside a plural format. A
literal apostrophe `'` is represented by either a single `'` or a doubled `''`
apostrophe character.

This package was previously named [messageformat-parser](https://www.npmjs.com/package/messageformat-parser).

[icu messageformat]: https://messageformat.github.io/guide/
[messageformat]: https://messageformat.github.io/
[unicode cldr]: http://cldr.unicode.org/index/cldr-spec/plural-rules
[apostrophe mode]: http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b

## Installation

```sh
npm install @messageformat/parser
```

## Usage

```js
> const { parse } = require('@messageformat/parser')
// For clarity, the examples below do not show the ctx object included for each token

> parse('So {wow}.')
[ { type: 'content', value: 'So ' },
  { type: 'argument', arg: 'wow' },
  { type: 'content', value: '.' } ]

> parse('Such { thing }. { count, selectordinal, one {First} two {Second}' +
        '                  few {Third} other {#th} } word.')
[ { type: 'content', value: 'Such ' },
  { type: 'argument', arg: 'thing' },
  { type: 'content', value: '. ' },
  { type: 'selectordinal',
    arg: 'count',
    cases: [
      { key: 'one', tokens: [ { type: 'content', value: 'First' } ] },
      { key: 'two', tokens: [ { type: 'content', value: 'Second' } ] },
      { key: 'few', tokens: [ { type: 'content', value: 'Third' } ] },
      { key: 'other',
        tokens: [ { type: 'octothorpe' }, { type: 'content', value: 'th' } ] }
    ] },
  { type: 'content', value: ' word.' } ]

> parse('Many{type,select,plural{ numbers}selectordinal{ counting}' +
                         'select{ choices}other{ some {type}}}.')
[ { type: 'content', value: 'Many' },
  { type: 'select',
    arg: 'type',
    cases: [
      { key: 'plural', tokens: [ { type: 'content', value: 'numbers' } ] },
      { key: 'selectordinal', tokens: [ { type: 'content', value: 'counting' } ] },
      { key: 'select', tokens: [ { type: 'content', value: 'choices' } ] },
      { key: 'other',
        tokens: [ { type: 'content', value: 'some ' }, { type: 'argument', arg: 'type' } ] }
    ] },
  { type: 'content', value: '.' } ]

> parse('{Such compliance')
// ParseError: invalid syntax at line 1 col 7:
//
//  {Such compliance
//        ^

> const msg = '{words, plural, zero{No words} one{One word} other{# words}}'
> parse(msg)
[ { type: 'plural',
    arg: 'words',
    cases: [
      { key: 'zero', tokens: [ { type: 'content', value: 'No words' } ] },
      { key: 'one', tokens: [ { type: 'content', value: 'One word' } ] },
      { key: 'other',
        tokens: [ { type: 'octothorpe' }, { type: 'content', value: ' words' } ] }
    ] } ]

> parse(msg, { cardinal: [ 'one', 'other' ], ordinal: [ 'one', 'two', 'few', 'other' ] })
// ParseError: The plural case zero is not valid in this locale at line 1 col 17:
//
//   {words, plural, zero{
//                   ^
```

For more example usage, please take a look at our [test suite](src/parser.test.ts).

## Structure

The output of `parse()` is an array of tokens, `Array<Content | PlainArg | FunctionArg | Select>`:

<!-- prettier-ignore -->
```typescript
interface Content {
  type: 'content'
  value: string
  ctx: Context
}

interface PlainArg {
  type: 'argument'
  arg: string
  ctx: Context
}

interface FunctionArg {
  type: 'function'
  arg: string
  key: string
  param?: Array<Content | PlainArg | FunctionArg | Select | Octothorpe>
  ctx: Context
}

interface Select {
  type: 'plural' | 'select' | 'selectordinal'
  arg: string
  cases: Array<SelectCase>
  pluralOffset?: number
  ctx: Context
}

interface SelectCase {
  key: string
  tokens: Array<Content | PlainArg | FunctionArg | Select | Octothorpe>
  ctx: Context
}

interface Octothorpe {
  type: 'octothorpe'
  ctx: Context
}

interface Context {
  offset: number
  line: number
  col: number
  text: string
  lineBreaks: number
}
```

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://code-of-conduct.openjsf.org/).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
