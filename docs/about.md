---
title: About
nav_order: 2
---

# About messageformat

Messageformat is an [OpenJS Foundation](https://openjsf.org) project, and we follow its [Code of Conduct](https://code-of-conduct.openjsf.org/).

## Features

- Handles arbitrary nesting of pluralization and select rules
- Supports all ~500 languages included in the Unicode CLDR
- Works on the server and the client
- Remarkably useful even for single-language use
- Can pre-compile messages to JavaScript code
- Compatible with other MessageFormat implementations
- Extendable with custom formatting functions
- Very whitespace tolerant
- Supports Unicode, including RTL and mixed LTR/RTL strings

## Packages

The project currently provides the following npm packages, all hosted under the [messageformat GitHub org](https://github.com/messageformat):

- [@messageformat/core](api/core.md) - The core library that transpiles MessageFormat strings into JavaScript functions
- [@messageformat/cli](cli.md) - A command-line client for the library
- [@messageformat/convert] - Converts other localization formats into MessageFormat
- [@messageformat/date-skeleton](api/date-skeleton.md) - Tools for working with [ICU DateFormat skeletons]
- [@messageformat/loader](webpack.md) - Webpack loader for message files
- [@messageformat/number-skeleton](api/number-skeleton.md) - Tools for working with [ICU NumberFormat skeletons]
- [@messageformat/parser](api/parser.md) - Parses MessageFormat source strings into an AST
- [@messageformat/react](react.md) - React hooks and other bindings for messages
- [@messageformat/runtime](api/runtime.md) - Runtime dependencies of compiled message modules
- [gettext-to-messageformat] - Converts gettext input files to ICU MessageFormat
- [messageformat-po-loader] - Webpack loader for messages in gettext files
- [messageformat-properties-loader] - Webpack loader for messages in Java .properties files
- [rollup-plugin-messageformat](rollup.md) - Rollup plugin for message files

Previous versions of the packages under the `@messageformat` npm org were published with names that used `messageformat-` as a prefix.

[@messageformat/convert]: https://www.npmjs.com/package/@messageformat/convert
[gettext-to-messageformat]: https://www.npmjs.com/package/gettext-to-messageformat
[icu dateformat skeletons]: http://userguide.icu-project.org/formatparse/datetime
[icu numberformat skeletons]: https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md
[messageformat-po-loader]: https://www.npmjs.com/package/messageformat-po-loader
[messageformat-properties-loader]: https://www.npmjs.com/package/messageformat-properties-loader

## License

You may use this software under the MIT License:

> Copyright OpenJS Foundation and contributors, <https://openjsf.org/>
>
> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> "Software"), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:
>
> The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
> LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
> OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
> WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contributing

We require all code contributions to be covered under the OpenJS Foundation's [Contributor License Agreement](https://js.foundation/CLA/). This can be done electronically and essentially ensures that you are making it clear that your contributions are your contributions and that you have the legal right to contribute them under our MIT license. If you've not previously signed the CLA, our bot will provide you with instructions for how to do so.

See [CONTRIBUTING.md](https://github.com/messageformat/messageformat/blob/main/CONTRIBUTING.md) in the main repo for more details.

## Core Contributors

- Alex Sexton - [@SlexAxton](http://twitter.com/SlexAxton) - [alexsexton.com](http://alexsexton.com/)
- Eemeli Aro - [@eemeli_aro](http://twitter.com/eemeli_aro) - [github.com/eemeli](https://github.com/eemeli)
