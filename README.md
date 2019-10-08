<div class="main-title">
<img align="right" width="100" height="100" src="https://messageformat.github.io/messageformat/logo/messageformat.svg">
<a class="badge" href="http://travis-ci.org/messageformat/messageformat"><img src="https://secure.travis-ci.org/messageformat/messageformat.svg" alt="Build Status"></a>
<h1>messageformat</h1>
</div>

The experience and subtlety of your program's text can be important. Messageformat is a mechanism for handling both **pluralization** and **gender** in your applications. It can also lead to much better translations, as it's designed to support [all the languages](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) included in the [Unicode CLDR](http://cldr.unicode.org/).

This monorepo consists of the following packages that make up our JS implementation of ICU MessageFormat:

- [messageformat](packages/messageformat/) - The core library that transpiles MessageFormat strings into JavaScript functions
- [messageformat-cli](packages/cli/) - A command-line client for the library
- [messageformat-convert](packages/convert/) - Converts other localization formats into MessageFormat
- [messageformat-loader](packages/loader/) - Webpack loader for JSON & YAML message files
- [messageformat-loader-example](packages/loader-example/) - Usage example for the loader
- [messageformat-parser](packages/parser/) - Parses MessageFormat source strings into an AST
- [messageformat-runtime](packages/runtime/) - Runtime dependencies of compiled message modules
- [messageformat-website](packages/website/) - The source of our [documentation site](https://messageformat.github.io/)

## Getting Started

```
npm install --save-dev messageformat
npm install --save messageformat-runtime
```

This includes the MessageFormat compiler and a runtime accessor class that provides a slightly nicer API for working with larger numbers of messages. Our [Format Guide] will help with the ICU MessageFormat Syntax, and the [Usage Guide] provides some options for integrating messageformat to be a part of your workflow around UI texts and translations.

[format guide]: https://messageformat.github.io/messageformat/page-guide
[usage guide]: https://messageformat.github.io/messageformat/page-build

---

[Messageformat]https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
