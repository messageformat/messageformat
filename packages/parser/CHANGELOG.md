# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/messageformat/messageformat/compare/@messageformat/parser@5.0.0-beta.1...@messageformat/parser@5.0.0) (2021-05-13)

**Note:** Version bump only for package @messageformat/parser





# 5.0.0-beta.1 (2020-11-29)


### Bug Fixes

* **core:** Adjustments for parser API changes ([6f77589](https://github.com/messageformat/messageformat/commit/6f77589ecae0eea6d965fe32baf92a2e657ecd4f))
* **parser:** Add parser.d.ts ([66f9249](https://github.com/messageformat/messageformat/commit/66f9249fd79d8be7e8cd2135015d9bf80db88255))
* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b58c3842fb0c426fcb20f21dd2721c3d192))
* Update dependencies ([11fd29b](https://github.com/messageformat/messageformat/commit/11fd29b587ac5e7f743d22ffd2ad3deab2789df8))
* **parser:** Allow non-lowercase custom formatter names, as long as they do not mask plural/select/selectordinal ([a38b181](https://github.com/messageformat/messageformat/commit/a38b181ea7bd8598030bb53ce17ef788766ac97d)), closes [#230](https://github.com/messageformat/messageformat/issues/230)
* **parser:** Use a stack of values for inPlural (Fixes [#226](https://github.com/messageformat/messageformat/issues/226)) ([71b8400](https://github.com/messageformat/messageformat/commit/71b84002b95e047a12ebe69bcaa1a1f7f986e70e))


### Features

* **parser:** Clarify argument interface names ([3eeb1de](https://github.com/messageformat/messageformat/commit/3eeb1de65ae2f2a6ebd785e2776d39894728d8e5))
* Rename npm packages to use the [@messageformat](https://github.com/messageformat) org ([#290](https://github.com/messageformat/messageformat/issues/290)) ([2e24133](https://github.com/messageformat/messageformat/commit/2e2413300ab000467ecbb53ecd6fa0cc7a38cbcf))
* **parser:** Add new implementation ([7e5385c](https://github.com/messageformat/messageformat/commit/7e5385c678357e15b2b95c745a8f7d3f0eef6961))
* **parser:** Replace parser with new implementation ([b2e9b78](https://github.com/messageformat/messageformat/commit/b2e9b7844fcec33b879a8de68dc5159656edc7bd))
* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474d9398007cf4be0275b3ab4ba39434acda))
* **parser:** Annotate rules for better errors ([cc010ac](https://github.com/messageformat/messageformat/commit/cc010ac3dc3413956e64ba7099ca1e929d534cf5)), closes [#215](https://github.com/messageformat/messageformat/issues/215)


### BREAKING CHANGES

* The packages are renamed to use the @messageformat org:
- `messageformat` -> `@messageformat/core`
- `messageformat-cli` -> `@messageformat/cli`
- `messageformat-convert` -> `@messageformat/convert`
- `messageformat-loader` -> `@messageformat/webpack-loader`
- `messageformat-parser` -> `@messageformat/parser`
- `messageformat-runtime` -> `@messageformat/runtime`
* **parser:** The parser is completely rewritten in TypeScript. The
new implementation uses `moo` to create a lexer, rather than PEG.js.
During this change, the AST output changes slightly:
- Static strings are wrapped in a { type: 'content', value: string }
  token, rather than plain strings.
- Each token includes a `ctx` object, with information about its source
  context.
- For plural & selectordinal tokens, the offset is renamed as
  `pluralOffset`.
- Some of the errors change; braces with contents that are not
  MessageFormat are mostly parsed without error.
- The TypeScript types are slightly refactored, as they're no longer
  manually maintained.





## [4.1.3](https://github.com/messageformat/messageformat/compare/messageformat-parser@4.1.2...messageformat-parser@4.1.3) (2020-04-12)

**Note:** Version bump only for package messageformat-parser





## [4.1.2](https://github.com/messageformat/messageformat/compare/messageformat-parser@4.1.1...messageformat-parser@4.1.2) (2019-07-17)


### Bug Fixes

* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b5))





## [4.1.1](https://github.com/messageformat/messageformat/compare/messageformat-parser@4.1.0...messageformat-parser@4.1.1) (2019-05-02)


### Bug Fixes

* Update dependencies ([11fd29b](https://github.com/messageformat/messageformat/commit/11fd29b))
* **parser:** Allow non-lowercase custom formatter names, as long as they do not mask plural/select/selectordinal ([a38b181](https://github.com/messageformat/messageformat/commit/a38b181)), closes [#230](https://github.com/messageformat/messageformat/issues/230)





# 4.1.0 (2019-03-03)


### Bug Fixes

* **parser:** Use a stack of values for inPlural (Fixes [#226](https://github.com/messageformat/messageformat/issues/226)) ([71b8400](https://github.com/messageformat/messageformat/commit/71b8400))


### Features

* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474))
* **parser:** Annotate rules for better errors ([cc010ac](https://github.com/messageformat/messageformat/commit/cc010ac)), closes [#215](https://github.com/messageformat/messageformat/issues/215)


# 4.0.0 (2018-12-05)


The changes included in this release are documented in PR [#8](https://github.com/messageformat/parser/pull/8):

* Allow MessageFormat content in function parameters
* Replace `strictNumberSign` option with broader `strict`


# 3.0.0 (2018-04-04)


* To conform with the ICU MessageFormat standard, escaping with a `\` is no longer supported (so e.g. the strings `\{` and `\u0123` are now passed through without changes). Instead, use ['quotes'](http://userguide.icu-project.org/formatparse/messages#TOC-Quoting-Escaping) to escape, e.g. `'{braces}'`. To help deal with this change, we provide a [codemod](https://github.com/messageformat/parser/blob/v3.0.0/codemod-fix-backslash-escapes.js) to handle the change for you.
* The optional parameter passed to a function is now a string, rather than an array of strings. So with e.g. `{var, func, your param}`, the parameter passed to func would be `' your param'`, including the leading space. As a consequence, we've also dropped the `strictFunctionParams` option.


# 2.0.0 (2017-11-18)


* Closer conformance with the ICU MessageFormat spec with respect to quoting and escaping text ([#3](https://github.com/messageformat/parser/pull/3)) and whitespace ([#6](https://github.com/messageformat/parser/pull/6)), thanks to [@nkovacs](https://github.com/nkovacs).


# 1.1.0 (2017-07-18)


* Add support for `strictFunctionParams`, thanks to [@nkovacs](https://github.com/nkovacs).


# 1.0.0 (2016-09-02)


* See [messageformat/messageformat#138](https://github.com/messageformat/messageformat/pull/138) for more information
