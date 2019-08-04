# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0](https://github.com/messageformat/messageformat/compare/messageformat@2.2.1...messageformat@2.3.0) (2019-07-17)


### Bug Fixes

* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b5))
* Update dependencies ([c395452](https://github.com/messageformat/messageformat/commit/c395452))


### Features

* **messageformat:** Add customFormatters to constructor options ([03b3b4f](https://github.com/messageformat/messageformat/commit/03b3b4f))
* **messageformat:** Add internal options object ([4741c9a](https://github.com/messageformat/messageformat/commit/4741c9a))
* **messageformat:** Add options as second constructor argument ([ec08716](https://github.com/messageformat/messageformat/commit/ec08716))
* **messageformat:** Update index.d.ts ([6df0797](https://github.com/messageformat/messageformat/commit/6df0797))





## [2.2.1](https://github.com/messageformat/messageformat/compare/messageformat@2.2.0...messageformat@2.2.1) (2019-05-18)


### Bug Fixes

* Fix browser field in messageformat/package.json ([341bc6f](https://github.com/messageformat/messageformat/commit/341bc6f))





# [2.2.0](https://github.com/messageformat/messageformat/compare/messageformat@2.1.0...messageformat@2.2.0) (2019-05-02)


### Bug Fixes

* **messageformat:** Build Web export from src with babel-loader, configured with browser targets ([3548009](https://github.com/messageformat/messageformat/commit/3548009))
* **messageformat:** Refactor/fix UMD/CommonJS exports ([41f6145](https://github.com/messageformat/messageformat/commit/41f6145))


### Features

* **formatters:** Split into its own package from messageformat ([ed36829](https://github.com/messageformat/messageformat/commit/ed36829))
* **messageformat:** Drop dependency on reserved-words, inlining data ([bfc2d89](https://github.com/messageformat/messageformat/commit/bfc2d89))
* **messageformat:** Move sources to src/, use Babel as transpiler targeting Node 6.5 ([d06553c](https://github.com/messageformat/messageformat/commit/d06553c))
* **messageformat:** Refactor compiler.js as ES6, splitting out utils.js ([91dc2ac](https://github.com/messageformat/messageformat/commit/91dc2ac))
* **messageformat:** Refactor messageformat.js as ES6 ([d29470f](https://github.com/messageformat/messageformat/commit/d29470f))
* **messageformat:** Refactor plurals.js as ES6 ([2a93ebf](https://github.com/messageformat/messageformat/commit/2a93ebf))
* **messageformat:** Refactor runtime.js as ES6 ([05125e0](https://github.com/messageformat/messageformat/commit/05125e0))
* **messageformat:** Replace Browserify + UglifyJS with Webpack as build tool ([620ca59](https://github.com/messageformat/messageformat/commit/620ca59))





# 2.1.0 (2019-03-03)


### Features

* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474))
* **compiler:** Allow MessageFormat content in function parameters ([e631239](https://github.com/messageformat/messageformat/commit/e631239))
* **messageformat:** Update messageformat-parser to 4.0 ([df76408](https://github.com/messageformat/messageformat/commit/df76408))
* Refactor as a monorepo, using Lerna ([#212](https://github.com/messageformat/messageformat/issues/212)) ([f573ffc](https://github.com/messageformat/messageformat/commit/f573ffc))


# 2.0.5 (2018-12-16)


### Bug Fixes

* Support BCP47 tag resolution for `new MessageFormat().compile(src, "fr-FR")` ([#197](https://github.com/messageformat/messageformat/issues/197))
* TS definitions:
  * Define `toString` with optional `global` argument ([#208](https://github.com/messageformat/messageformat/issues/208) by [@rbardini](https://github.com/rbardini))
  * Use type union parameter for MessageFormat constructor ([#210](https://github.com/messageformat/messageformat/issues/210) by [@lephyrus](https://github.com/lephyrus))
* Fix guide.md typo ([#211](https://github.com/messageformat/messageformat/issues/211) by [@Kemito](https://github.com/Kemito))


# 2.0.4 (2018-07-21)


### Bug Fixes

* Fix index.d.ts (reported [#199](https://github.com/messageformat/messageformat/issues/199) and fixed [#200](https://github.com/messageformat/messageformat/issues/200) by [@mbarz](https://github.com/mbarz))


# 2.0.3 (2018-07-19)


### Bug Fixes

* Include index.d.ts in the npm release
* Update dependencies


# 2.0.2 (2018-04-23)


### Bug Fixes

* Remove ES6-isms from messages.js (were blocking minification)


# 2.0.1 (2018-04-18)


### Bug Fixes

* Add TypeScript definition file ([#194](https://github.com/messageformat/messageformat/issues/194))
* Force input to string in `MessageFormat.escape`


# 2.0.0 (2018-04-04)


### Breaking Changes

* Publish the `messageformat` CLI binary as its own package [messageformat-cli](https://www.npmjs.com/package/messageformat-cli)
  * Support reading locale data from `.properties` files
  * Read config from `package.json` and `messageformat.rc.json`
  * Add new options `--delimiters`, `--eslint-disable`, `--extensions`, `--outfile`, and `--simplify`
* Update [messageformat-parser](https://www.npmjs.com/package/messageformat-parser) from 1.1.0 to 3.0.0
  * To conform with the ICU MessageFormat standard, escaping with a `\` is no longer supported. Instead, use ['quotes'](http://userguide.icu-project.org/formatparse/messages#TOC-Quoting-Escaping) to escape `{}` and `#` when needed. To help deal with this change, we provide a [codemod](https://github.com/messageformat/parser/blob/v3.0.0/codemod-fix-backslash-escapes.js) to handle the change for you.
  * The optional parameter passed to a formatter function is now a string, rather than an array of strings. So with e.g. `{var, func, your param}`, the parameter passed to `func` would be `'your param'`.
  * Closer conformance with the spec for identifiers, which means that characters in [`[:Pattern_Syntax:]`](https://unicode.org/cldr/utility/list-unicodeset.jsp?a=%5B%3APattern_Syntax%3A%5D&g=&i=) are no longer allowed in identifiers. Note in particular that this includes `-`, which was previously allowed.
* Expect `Intl` to exist and drop `#setIntlSupport()`
* Compiled output:
  * Default to ES6 module output from `#toString()` with no parameters
  * Drop support for `#toString('exports')`; use `#toString('module.exports')` for CommonJS output

### Features

* Rename the repository as [messageformat/messageformat](https://github.com/messageformat/messageformat), dropping the final `.js`
* Completely revamp the [website](https://messageformat.github.io/messageformat/)
* Add a runtime accessor class [Messages](https://messageformat.github.io/messageformat/Messages), available as `import Messages from 'messageformat/messages'`
* Refactor formatters
  * Add `duration` formatter
  * number: Add `currency:CODE` option
* Use npm scripts rather than Makefile to test and build the package


For details of v1 and earlier releases, please consult the project's [GitHub release info](https://github.com/messageformat/messageformat/releases?after=v2.0.0-beta.1).
