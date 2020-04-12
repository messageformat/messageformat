# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
