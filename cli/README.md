# Command-line MessageFormat Compiler

Parses the input JSON file(s) of MessageFormat strings into a JS module of corresponding hierarchical functions, written to stdout. Directories are recursively scanned for all `.json` files. With multiple input files, shared parts of the start of their paths are dropped out of the generated module's structure.


## Installation

```
npm install messageformat messageformat-cli
```

`messageformat` is a peer dependency of `messageformat-cli`.

## Usage

```
npx messageformat [options] input
```
or
```
./node_modules/.bin/messageformat [options] input
```


## Options

### `-l lc, --locale=lc`
The locale(s) lc to include; if multiple, selected by matching message key. [default: `'en'`]

### `-n ns, --namespace=ns`
The global object or modules format for the output JS. If ns does not contain a `.`, the output follows an UMD pattern. For module support, the values `'export default'` (ES6), `exports` (CommonJS), and `module.exports` (node.js) are special. [default: `'module.exports'`]

### `--disable-plural-key-checks`
By default, messageformat throws an error when a statement uses a non-numerical key that will never be matched as a pluralization category for the current locale. Use this argument to disable the validation and allow unused plural keys. [default: `false`]

### `--enable-intl-support`
Because native or polyfilled support for global Intl object is not guaranteed, messageformat will disable Intl formatters by default. If you require Intl support, you can use this argument to enable Intl formatters for your messages. [default: `false`]

### `--eslint-disable`
Add an `/* eslint-disable */` comment as the first line of the output, to silence ESLint warnings. [default: `false`]

### `--simplify`
Simplify the output object structure, by dropping intermediate keys when those keys are shared across all objects at that level, in addition to the default filtering-out of shared keys at the root of the object. [default: `false`]


## Examples

With `messages/strings.json`, compile it into a node.js module using the default English locale:
```
npx messageformat messages/strings.json > messages/en.js
```

With `messages/en.json` and `messages/fr.json`, combine both into an ES6-compatible module, with the top-level keys `en` and `fr` containing functions that each use the correct language's pluralization rules:
```
npx messageformat --locale=en,fr --namespace='export default' messages/ > messages.js
```

