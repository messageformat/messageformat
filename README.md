<div class="main-title">
<img align="right" width="100" height="100" src="https://messageformat.github.io/messageformat/logo/messageformat.svg">
<h1>messageformat</h1>
</div>

The experience and subtlety of your program's text can be important.
Messageformat is a mechanism for handling both **pluralization** and **gender** in your applications.
It can also lead to much better translations, as it's designed to support [all the languages] included in the [Unicode CLDR].

This monorepo consists of the following packages that make up our JS implementation of ICU MessageFormat:

- [@messageformat/cli](packages/cli/) - A command-line client for the library
- [@messageformat/convert](packages/convert/) - Converts other localization formats into MessageFormat
- [@messageformat/core](packages/core/) - The core library that transpiles MessageFormat strings into JavaScript functions
- [@messageformat/date-skeleton](packages/date-skeleton) - Tools for working with [ICU DateFormat skeletons]
- [@messageformat/loader](packages/webpack-loader/) - Webpack loader for JSON, YAML, & .properties message files
- [@messageformat/number-skeleton](packages/number-skeleton) - Tools for working with [ICU NumberFormat skeletons]
- [@messageformat/parser](packages/parser/) - Parses MessageFormat source strings into an AST
- [@messageformat/react](packages/react/) - React hooks and other bindings for messages
- [@messageformat/runtime](packages/runtime/) - Runtime dependencies of compiled message modules
- [rollup-plugin-messageformat](packages/rollup-plugin/) - Rollup plugin for JSON, YAML, & .properties message files

[all the languages]: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
[unicode cldr]: http://cldr.unicode.org/
[icu dateformat skeletons]: http://userguide.icu-project.org/formatparse/datetime
[icu numberformat skeletons]: https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md

## Getting Started

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

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
