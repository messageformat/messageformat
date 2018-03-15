# Command-line MessageFormat Compiler

Parses and compiles the input JSON and [.properties](https://en.wikipedia.org/wiki/.properties) file(s) of MessageFormat strings into a JS module of corresponding hierarchical functions.


## Installation

```
npm install messageformat@next messageformat-cli
```

[`messageformat`](https://www.npmjs.com/package/messageformat) is a peer dependency of `messageformat-cli`, and needs to be installed separately.


## Usage

```
npx messageformat [options] [input]
```
or
```
./node_modules/.bin/messageformat [options] [input]
```

`input` should consist of one or more files or directories, unless defined in a configuration file. Directories are recursively scanned for `.json` and `.properties` files. With multiple input files, shared parts of the start of their paths are dropped out of the generated module's structure.


## Options

In addition to defining options on the command line, options may also be set in the **`"messageformat"`** object in your **`package.json`** file, or in a **`messageformat.rc.json`** configuration file, using the long-form option names as keys. Input files and directories may also be given as an **`"include"`** array in a configuration file. Command-line options override configuration files.

### `-l lc, --locale=lc`
The locale(s) _`lc`_ to include; if multiple, selected by matching message key. [default: `'en'`]

### `-n ns, --namespace=ns, --es6`
The global object or modules format for the output JS. If _`ns`_ does not contain a `.`, the output follows an UMD pattern. For module support, the values `'export default'` (ES6, shorthand `--es6`), `exports` (CommonJS), and `module.exports` (node.js) are special. [default: `'module.exports'`]

### `-o of, --outfile=of`
Write output to the file _`of`_. If unspecified or `-`, prints to stdout.

### `--delimiters`
Set of characters by which the file path is split into output object keys. [default: `._/` or `._\` depending on platform]

### `--disable-plural-key-checks`
By default, messageformat throws an error when a statement uses a non-numerical key that will never be matched as a pluralization category for the current locale. Use this argument to disable the validation and allow unused plural keys. [default: `false`]

### `--eslint-disable`
Add an `/* eslint-disable */` comment as the first line of the output, to silence [ESLint](https://eslint.org/) warnings. [default: `false`]

### `--extensions`
Array or comma-separated list of file extensions to parse as source files. [default: `['.json', '.properties']`]

### `--simplify`
Simplify the output object structure, by dropping intermediate keys when those keys are shared across all objects at that level, in addition to the default filtering-out of shared keys at the root of the object. [default: `false`]


## Examples

With `messages/strings.json`, compile it into a node.js module using the default English locale:
```
npx messageformat messages/strings.json > messages/en.js
```

----
With `messages/en.json` and `messages/fr.json`, combine both into an ES6-compatible module, with the top-level keys `en` and `fr` containing functions that each use the correct language's pluralization rules:
```
npx messageformat --locale=en,fr --es6 messages/ > messages.js
```

----
Same, but with this configuration in `package.json`:
```
{
  ...,
  "messageformat": {
    "es6": true,
    "locale": ["en", "fr"],
    "include": [
      "messages/"
    ],
    "outfile": "messages.js"
  },
  "scripts": {
    ...,
    "build:messages": "messageformat"
  }
}
```

```
npm run build:messages
```
