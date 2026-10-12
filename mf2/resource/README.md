# Tools for Unicode MessageFormat Resource Files

This library works with [message resources],
a standard being incubated by the [W3C Internationalization WG].
Message resources define a human-friendly text file representation
for [Unicode MessageFormat 2.0] messages,
along with their associated metadata and comments.

The specification for message resources is under active development,
so expect breaking changes between 0.x version releases.
This release corresponds to the specification as of
[2026-10-07](https://github.com/w3c/i18n-discuss/blob/cf621e15d1066316b8150208c43a2200fa9317fa/explainers/message-resource.abnf).

[message resources]: https://github.com/w3c/i18n-discuss/blob/gh-pages/explainers/message-resources.md
[w3c internationalization wg]: https://www.w3.org/International/
[unicode messageformat 2.0]: https://github.com/unicode-org/message-format-wg

```sh
npm install --save-exact @messageformat/resource
```

## API

Two data model representations of message resources are provided:

- A concrete syntax tree (CST) representing all text characters of a resource file.
  Its parser (`parseCST`) will report errors by calling an `onError` error handler.
- A data model or abstract syntax tree (AST)
  representing only the data relevant for working with the resource contents.
  Its parser (`parseMessageResource`) will throw a `MessageResourceParseError` on any error.

Unless you're building a validator of some sort,
you probably want to use the data model representation.

No message resource serialiser is currently provided.

### `parseMessageResource(source: string): MessageResource`

```ts
import { parseMessageResource } from '@messageformat/resource';
```

Parse input into a tree of Message data model values.

The frontmatter locale is required;
all other metadata is ignored.

A `MessageResource` extends `Map`, adding a `.locale: string` for the resource locale.
It contains `MessageWrapper` values, which also extend `Map`,
adding a `.value?: Model.Message` with `messageformat` data model message values.
To represent message group hierarchies,
the values in the `MessageWrapper` map are also `MessageWrapper` values.

Throws `MessageResourceParseError` on error.

### `parseCST(source: string, onError): CST.Resource`

```ts
import { type CST, parseCST } from '@messageformat/resource';
```

Parse input into a MessageResource CST.

Should never throw an Error except due to resource exhaustion.

The `onError` function is called as `(range: CST.Range, msg: string) => void`.
It may be called multiple times for bad input.

### `buildMessageResourceFromCST(cst: CST.Resource): MessageResource`

```ts
import { buildMessageResourceFromCST } from '@messageformat/resource';
```

Compile a `CST.Resource` value into a tree of `Message` values.

### `compileMessageResource(resource: MessageResource, options?): Map<string, MessageFormatWrapper>`

Compile a parsed tree of Message data models
into a tree of MessageFormat instances.

If set, the `options` are `MessageFormatOptions` that are used for each MessageFormat instance.
The locale is set by `resource.locale`.

In the returned map, `MessageFormatWrapper` values extend `Map`,
adding a `.value?: MessageFormat` for each leaf node.
The structure of the map is the same as that of `resource`.
