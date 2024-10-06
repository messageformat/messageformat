<div class="main-title">
<img align="right" width="100" height="100" src="https://messageformat.github.io/messageformat/logo/messageformat.svg">
<h1>messageformat</h1>
</div>

The experience and subtlety of your program's text can be important.
Messageformat is a mechanism for handling both **pluralization** and **gender** in your applications.
It can also lead to much better translations, as it's designed to support [all the languages] included in the [Unicode CLDR].

This monorepo provides packages supporting JS implementations of both [ICU MessageFormat] (MF1) and [Unicode MessageFormat 2] (MF2):

## ICU MessageFormat 1 Packages

- [@messageformat/cli](mf1/packages/cli/) - A command-line client for the library
- [@messageformat/convert](mf1/packages/convert/) - Converts other localization formats into ICU MessageFormat
- [@messageformat/core](mf1/packages/core/) - The core library that transpiles MessageFormat strings into JavaScript functions
- [@messageformat/date-skeleton](mf1/packages/date-skeleton) - Tools for working with [ICU DateFormat skeletons]
- [@messageformat/loader](mf1/packages/webpack-loader/) - Webpack loader for JSON, YAML, & .properties message files
- [@messageformat/number-skeleton](mf1/packages/number-skeleton) - Tools for working with [ICU NumberFormat skeletons]
- [@messageformat/parser](mf1/packages/parser/) - Parses MessageFormat source strings into an AST
- [@messageformat/react](mf1/packages/react/) - React hooks and other bindings for messages
- [@messageformat/runtime](mf1/packages/runtime/) - Runtime dependencies of compiled message modules
- [rollup-plugin-messageformat](mf1/packages/rollup-plugin/) - Rollup plugin for JSON, YAML, & .properties message files

## Unicode MessageFormat 2 Packages

- [messageformat](mf2/messageformat/) - **_(BETA)_** Intl.MessageFormat / MF2 parser, runtime and polyfill
- [@messageformat/fluent](mf2/fluent) - **_(BETA)_** Compile Fluent sources into MF2 resources
- [@messageformat/icu-messageformat-1](mf2/icu-messageformat-1) - **_(BETA)_** Compile MF1 sources into MF2 formatters

[all the languages]: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
[unicode cldr]: http://cldr.unicode.org/
[icu messageformat]: https://unicode-org.github.io/icu/userguide/format_parse/messages/
[unicode messageformat 2]: https://github.com/unicode-org/message-format-wg
[icu dateformat skeletons]: https://unicode-org.github.io/icu/userguide/format_parse/datetime/
[icu numberformat skeletons]: https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html

## Getting Started (MF1)

Depending on your situation, consult one or more of the following guides:

- [Command-line](http://messageformat.github.io/messageformat/cli/)
- [Rollup](http://messageformat.github.io/messageformat/rollup/)
- [Webpack](http://messageformat.github.io/messageformat/webpack/)
- [React](http://messageformat.github.io/messageformat/react/)

Alternatively, take a look at our [examples](examples/) or dig into the [API documentation](http://messageformat.github.io/messageformat/api/) if you're looking to do something more involved.

Our [Format Guide] will help with the ICU MessageFormat Syntax, and the [Usage Guide] provides some further options for integrating messageformat to be a part of your workflow around UI texts and translations.

[format guide]: https://messageformat.github.io/messageformat/guide
[usage guide]: https://messageformat.github.io/messageformat/use

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://code-of-conduct.openjsf.org/).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
