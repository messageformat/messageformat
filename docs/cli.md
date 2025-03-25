---
title: Command-line
parent: Usage
nav_order: 1
---

# Command-line MessageFormat Compiler

Parses and compiles JSON, YAML and .properties files of ICU MessageFormat strings into an ES module of corresponding hierarchical functions.

This package was previously named [messageformat-cli].

## Installation

```
npm install --save-dev @messageformat/core @messageformat/cli
```

If you're intending to publish a library with external dependencies, you should also include the [runtime] as a dependency:

```
npm install @messageformat/runtime
```

## Usage

```
npx messageformat [options] [input]
```

`input` should consist of one or more files or directories, unless defined in a configuration file.
Directories are recursively scanned for `.json`, `.yaml`, `.yml` and `.properties` files.
With multiple input files, shared parts of the start of their paths are dropped out of the generated module's structure.

## Options

In addition to defining options on the command line, options may also be set in the **`"messageformat"`** object in your **`package.json`** file, or in a **`messageformat.rc.{js,json,yaml}`** configuration file, using the long-form option names as keys.
Input files and directories may also be given as an **`"include"`** array in a configuration file.
Command-line options override configuration files.

| Option       | Short | Description                                                                                                                                                                                                                                                    |
| ------------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `delimiters` | `-d`  | Set of characters by which the file path is split into output object. Default value is `._/` or `._\`, depending on the platform.                                                                                                                              |
| `extensions` | `-e`  | Array or comma-separated list of file extensions to parse as source files. Default: `['.json', '.yaml', '.yml', '.properties']`                                                                                                                                |
| `locale=lc`  | `-l`  | The locale(s) _`lc`_ to include; if multiple, first is default and others are selected by matching message key. If not set or empty, path keys matching any locale code will set the active locale, starting with a default `en` locale.                       |
| `options`    |       | Options to pass to the MessageFormat constructor via its second argument. On the command line, use dot-notation to set values, e.g. `--options.currency=EUR`. For custom formatters, string values will be require()'d based on the current working directory. |
| `outfile=of` | `-o`  | Write output to the file _`of`_. If unspecified or `-`, prints to stdout.                                                                                                                                                                                      |
| `simplify`   | `-s`  | Simplify the output object structure, by dropping intermediate keys when those keys are shared across all objects at that level, in addition to the default filtering-out of shared keys at the root of the object.                                            |

## Examples

With `messages/strings.json`, compile it into an ES module using the default English locale:

```
npx @messageformat/cli messages/strings.json --outfile=messages/en.js
```

---

With `messages/en.json` and `messages/fr.json`, combine both into an ES module, with the default export's top-level keys `en` and `fr` containing functions that each use the correct language's pluralization rules:

```
npx @messageformat/cli messages/ --locale=en,fr --outfile=messages.js
```

Note: The `locale` option could be left out here if is known that the data does not include any 2-3 letter keys matching other locales.

---

Same, but with this configuration in `package.json`:

```
{
  ...,
  "messageformat": {
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

[messageformat-cli]: https://www.npmjs.com/package/messageformat-cli
[runtime]: https://messageformat.github.io/messageformat/api/runtime/
