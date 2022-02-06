# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.1](https://github.com/messageformat/messageformat/compare/@messageformat/core@3.0.0...@messageformat/core@3.0.1) (2022-02-06)

### Bug Fixes

* Relax MessageFunction argument type ([#351](https://github.com/messageformat/messageformat/issues/351))

# [3.0.0](https://github.com/messageformat/messageformat/compare/@messageformat/core@3.0.0-beta.3...@messageformat/core@3.0.0) (2021-05-13)


* test!: Drop Node.js 10 tests/support due to its EOL (#322) ([5b1172b](https://github.com/messageformat/messageformat/commit/5b1172b534baa2476bac281db9393d958a0f8272)), closes [#322](https://github.com/messageformat/messageformat/issues/322)


### Bug Fixes

* Allow overriding default formatters ([6faedbe](https://github.com/messageformat/messageformat/commit/6faedbefe4ae1e027ccb24cf05a55fc45be551b7))
* Properly complain about reserved identifier names during build ([39cf8aa](https://github.com/messageformat/messageformat/commit/39cf8aab952495d6ea5aa3997d06fc07a689ca8b))
* Tighten up TS types, getting rid of almost all `any` ([21de670](https://github.com/messageformat/messageformat/commit/21de670019d5467f804560565319bf37abfbac0a))


### Features

* **core:** Rename "strictNumberSign" option as "strict" ([#311](https://github.com/messageformat/messageformat/issues/311)) ([dead6b3](https://github.com/messageformat/messageformat/commit/dead6b38c93d7477ff7cf209351c9c9de4450c6c))
* Allow for custom formatters imported from runtime modules ([a58ade1](https://github.com/messageformat/messageformat/commit/a58ade19595476cdeffe7b151831dbfe8f754581))
* Make arg shape customisable for custom formatters ([8510f2c](https://github.com/messageformat/messageformat/commit/8510f2c4f849a8467eaa6cc46e7ec6d5cc111289))
* Use TS generics to specify the message function return type ([530f13f](https://github.com/messageformat/messageformat/commit/530f13f8c8e91aed7306ecccc66efa1545cae29c))
* **compiler:** Use fat-arrow notation for message functions ([d9a94bb](https://github.com/messageformat/messageformat/commit/d9a94bb45593e98bcf4e8ff209d29150fbaccb37))


### BREAKING CHANGES

* Tests for the library in Node.js 10 are dropped. No
immediate changes should cause any part of the library not to work with
Node.js 10, but that will no longer be verified by CI tests or otherwise.





# 3.0.0-beta.3 (2020-11-29)


### Bug Fixes

* **core:** Adjustments for parser API changes ([6f77589](https://github.com/messageformat/messageformat/commit/6f77589ecae0eea6d965fe32baf92a2e657ecd4f))
* **core:** Export the types PluralFunction, StringStructure ([588d00a](https://github.com/messageformat/messageformat/commit/588d00ab33b3420932c10d6fde7bf6292bbff4d4))


### Features

* Import messageformat-date-skeleton sources ([0788cb3](https://github.com/messageformat/messageformat/commit/0788cb3fc623345b2cd816ce9e78676f922e10be))
* Import messageformat-number-skeleton sources ([11c7afb](https://github.com/messageformat/messageformat/commit/11c7afb928c6364caa4942de380ed4b8d91a276d))
* Rename npm packages to use the [@messageformat](https://github.com/messageformat) org ([#290](https://github.com/messageformat/messageformat/issues/290)) ([2e24133](https://github.com/messageformat/messageformat/commit/2e2413300ab000467ecbb53ecd6fa0cc7a38cbcf))
* Rename packages as @messageformat/date-skeleton & @messageformat/number-skeleton ([05ee7ae](https://github.com/messageformat/messageformat/commit/05ee7aec04152d0795ccd3d5f43717acbe0c9f76))


### BREAKING CHANGES

* The packages are renamed to use the @messageformat org:
- `messageformat` -> `@messageformat/core`
- `messageformat-cli` -> `@messageformat/cli`
- `messageformat-convert` -> `@messageformat/convert`
- `messageformat-loader` -> `@messageformat/webpack-loader`
- `messageformat-parser` -> `@messageformat/parser`
- `messageformat-runtime` -> `@messageformat/runtime`





# [3.0.0-beta.2](https://github.com/messageformat/messageformat/compare/messageformat@3.0.0-beta.1...messageformat@3.0.0-beta.2) (2020-04-12)


### Bug Fixes

* Update make-plural dependency to 6.0.1 ([fb5ceaf](https://github.com/messageformat/messageformat/commit/fb5ceafccfc75bfcda6941e815ffbba18a419b9d))


### Features

* **build:** Replace Webpack with Rollup as messageformat bundler ([#278](https://github.com/messageformat/messageformat/issues/278)) ([a6b7a34](https://github.com/messageformat/messageformat/commit/a6b7a347d7fc26c61f2dca628fca91908f504f18))
* **compiler:** Add requireAllArguments option to compiler ([#267](https://github.com/messageformat/messageformat/issues/267)) ([eb4f194](https://github.com/messageformat/messageformat/commit/eb4f194759629332c80e695a0a9ef64b6e51a422))
* **messageformat:** Add support for date skeletons ([#279](https://github.com/messageformat/messageformat/issues/279)) ([6283a68](https://github.com/messageformat/messageformat/commit/6283a689eeb1b32a937441715181460d86d01ade))
* **messageformat:** Add support for number patterns & skeletons ([#272](https://github.com/messageformat/messageformat/issues/272)) ([c1aef99](https://github.com/messageformat/messageformat/commit/c1aef998ee2417f319bd2e426e1e56c3e73ede3b))





# [3.0.0-beta.1](https://github.com/messageformat/messageformat/compare/messageformat@3.0.0-beta.0...messageformat@3.0.0-beta.1) (2019-10-15)


### Bug Fixes

* **messageformat:** Include compile-module in npm package ([0b8aafe](https://github.com/messageformat/messageformat/commit/0b8aafe6871eceb9cbe067953b787c0719e81289))





# [3.0.0-beta.0](https://github.com/messageformat/messageformat/compare/messageformat@2.3.0...messageformat@3.0.0-beta.0) (2019-10-15)


### Bug Fixes

* **messageformat:** Adjust for formatter API change ([a811e81](https://github.com/messageformat/messageformat/commit/a811e811b1b41a2bd481e9aa23cbede03d3d0089))
* **messageformat:** Support selectordinal with offset ([27d61f7](https://github.com/messageformat/messageformat/commit/27d61f7e6399424a35359766dfda037a22603802))
* **runtime:** Cache Intl.NumberFormat instances for # ([81d1f59](https://github.com/messageformat/messageformat/commit/81d1f59b5d63d3fbfcb882dd10b98bb3de6d4965))


### Features

* Add choice between string & values array output ([#242](https://github.com/messageformat/messageformat/issues/242)) ([3e642f0](https://github.com/messageformat/messageformat/commit/3e642f0e0ca9a9e6078455fd8986b98129d0672f))
* Add special-casing for common number formatters ([39d02e9](https://github.com/messageformat/messageformat/commit/39d02e9aeca06ee6b7696c02bb3a72c6277620ad))
* Always apply locale-specific checks to plural cases ([d5d746c](https://github.com/messageformat/messageformat/commit/d5d746c873504e5146d37be72bd1214b6d52c48f))
* **messageformat:** Add special locale "*" to match all of them ([f691d4b](https://github.com/messageformat/messageformat/commit/f691d4b9c200db8d6e42b5c2f901511e04dca942))
* Drop MessageFormat#addFormatters() ([af0b0ba](https://github.com/messageformat/messageformat/commit/af0b0ba827a9d3684ed9ac9d346b50676674eb73))
* Drop MessageFormat#setBiDiSupport() & #setStrictNumberSign() ([309826d](https://github.com/messageformat/messageformat/commit/309826d2b4669a2cbf90196045ed11e8c42c12cb))
* **runtime:** Refactor, dropping class wrapper ([0ba6ebb](https://github.com/messageformat/messageformat/commit/0ba6ebb61a4d13500a836a28969204490964d429))
* Merge formatters into runtime ([1cef20b](https://github.com/messageformat/messageformat/commit/1cef20b576e14f46f268de6e9e1a688f00993f40))
* Move runtime to its package; split stringify-dependencies from it ([fbc10a5](https://github.com/messageformat/messageformat/commit/fbc10a5fed14ddde4170d4e20290497e2aaac3b9))
* Refactor formatter caching during compilation ([315b7af](https://github.com/messageformat/messageformat/commit/315b7afdf3b68ff402787c5ba0d47500c8d33d06))
* Stop reusing runtime ([c7a7879](https://github.com/messageformat/messageformat/commit/c7a7879e2db4dafec68f40c93bba1603d98a80c6))
* Update to make-plural v5 ([851f698](https://github.com/messageformat/messageformat/commit/851f6984787f3dced3ea7c01127bf4a218dc9be7))
* Use cardinal-only plurals where appropriate ([e499b1f](https://github.com/messageformat/messageformat/commit/e499b1f81d0fce5503e4c7a19b792400d499d483))
* **messages:** Split messageformat-messages into its own package ([b49b40b](https://github.com/messageformat/messageformat/commit/b49b40bff1a7943a8f33b677705e873af1ccca54))
* Use the options object to set the default currency ([7430532](https://github.com/messageformat/messageformat/commit/74305327926ecf003217a86c585418062d71ab16))
* **messageformat:** Add runtime dependency on make-plural@6 ([2f56ef3](https://github.com/messageformat/messageformat/commit/2f56ef3cdf61d4c1e2341ff20ca136fe98c43e13))
* **messageformat:** Add runtime dependency on messageformat-runtime ([92e6fe5](https://github.com/messageformat/messageformat/commit/92e6fe523e82bad3c3ed4f09a5b6e73885fc182a))
* **messageformat:** Add static supportedLocalesOf() method ([f2834f8](https://github.com/messageformat/messageformat/commit/f2834f81b8181aaae2bbd842352efda30829c1a2))
* **messageformat:** Always format # as number ([20d6fdb](https://github.com/messageformat/messageformat/commit/20d6fdbc9a30e49aa0bbad3a7bcc07625cb9d008))
* **messageformat:** Import formatters in runtime ([f9b7d50](https://github.com/messageformat/messageformat/commit/f9b7d50f4614ffea5164414081238e77a5b62f48))
* **messageformat:** Make compileModule() into a separate function ([d4a060f](https://github.com/messageformat/messageformat/commit/d4a060ff4c1f72fe682206f0bd296bc6268834e5))
* **messageformat:** Move getFormatter() to compiler.js ([76018ff](https://github.com/messageformat/messageformat/commit/76018fff179561277ff1afe4673d8d2e3f50af4d))
* **messageformat:** Output module string directly from compileModule() ([380c690](https://github.com/messageformat/messageformat/commit/380c690d1cd1977178227781374ca3de398df938))
* **messageformat:** Publish identifier utils as "safe-identifier" ([6d57cdd](https://github.com/messageformat/messageformat/commit/6d57cddb9fb218de1a028d9eb219584bcee2c826))
* **messageformat:** Refactor compiler output ([8901d9a](https://github.com/messageformat/messageformat/commit/8901d9a436031d60cb1ac74d8816fa48890a5e76))
* **messageformat:** Refactor plurals, and a few other things ([36429af](https://github.com/messageformat/messageformat/commit/36429af15bff93320915173e214433dc192e37c6))
* **messageformat:** Refactor/clean up compile() internals ([1127c99](https://github.com/messageformat/messageformat/commit/1127c99279664b3aeb0c0db9fb3734d7862a6d20))
* **messageformat:** Split compileModule() from compile() ([32f6b52](https://github.com/messageformat/messageformat/commit/32f6b5282aa1eacbea87bbb9e05946c366b5caed))
* **runtime:** Add make-plural as an explicit dependency ([95509a7](https://github.com/messageformat/messageformat/commit/95509a7c2fc0caffd4255d6e22bf4132c401ce9c))


### BREAKING CHANGES

* This drops/deprecates the messageformat-formatters
package, moving its exports to messageformat-runtime/lib/formatters.
* Use the customFormatters constructor option instead.
* **messageformat:** The module compiler now needs to be imported separately
when used.

Before:
    import MessageFormat from 'messageformat'
    const mf = new MessageFormat('en')
    mf.compileModule(...)

Now:
    import MessageFormat from '@messageformat/core'
    import compileModule from '@messageformat/core/compile-module'
    const mf = new MessageFormat('en')
    compileModule(mf, ...)
* **messageformat:** This change introduces import statements into the
module output.
* **messageformat:** Before, compiled modules could be directly used, and
included a built-in stringifier. Now, compiled modules are output as the
source code of an ES module.
* **messageformat:** This refactors a core API, separating the compilation
of individual messages vs. collections of messages.
* **messageformat:** This drops the second locale arg of
MessageFormat#compile(), and removes the default of supporting all
locales if initialised with an empty locale. Also, the API for custom
plural categorisation functions now expects an array rather than an
object of functions.
* This changes the API

Before:
    import MessageFormat from 'messageformat'
    const mf = new MessageFormat('en')
    mf.currency = 'EUR'
    const msg = mf.compile('{V, number, currency}')

Now:
    import MessageFormat from '@messageformat/core'
    const mf = new MessageFormat('en', { currency: 'EUR' })
    const msg = mf.compile('{V, number, currency}')
* **messageformat:** Previously, non-numeric values used as plural arguments
could be referred to using # while keeping their original value. With
this change, they now get converted to numbers and then formatted,
probably coming out as "NaN" instead.
* **messages:** Previously, messages were a part of the core
messageformat package. To use them, messageformat needed to be installed
as a runtime rather than dev dependency. For clarity, it's here
separated into its own package.
* This drops MessageFormat.formatters as well as
MessageFormat#fmt, which had public visibility but were not explicitly
documented as public.
* This removes the MessageFormat#runtime instance
* Use the biDiSupport & strictNumberSign constructor
options instead.
* This removes both the pluralKeyChecks option, as well
as the disablePluralKeyChecks() method. To avoid the checks, pass in your
own plural category function.
* **runtime:** This drops the error-throwing from the non-strict
number() variant.





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
