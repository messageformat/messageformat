# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.0.0-beta.2 (2020-11-29)


### Bug Fixes

* Update dependencies ([1fa93cb](https://github.com/messageformat/messageformat/commit/1fa93cb1fa48bbc05256171e8a27f7b934f4abb2))
* **cli:** Adjust for change in MessageFormat API ([ee526b8](https://github.com/messageformat/messageformat/commit/ee526b897ce99e5354408a05910d651bff34828e))
* Adjust for change in MessageFormat API ([b5e34c2](https://github.com/messageformat/messageformat/commit/b5e34c2f5148f4f73c3d9506c5dc769facb5a2e1))
* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b58c3842fb0c426fcb20f21dd2721c3d192))
* Update dependencies ([c395452](https://github.com/messageformat/messageformat/commit/c395452021bcacf32960e2a0cc4f4e9fe1a6e97a))


### Features

* Rename npm packages to use the [@messageformat](https://github.com/messageformat) org ([#290](https://github.com/messageformat/messageformat/issues/290)) ([2e24133](https://github.com/messageformat/messageformat/commit/2e2413300ab000467ecbb53ecd6fa0cc7a38cbcf))
* **cli:** Add --options ([1722001](https://github.com/messageformat/messageformat/commit/172200118de75ef985da40d8a5b2976636b3db0f))
* **cli:** Add support for messageformat.rc.js ([8464a73](https://github.com/messageformat/messageformat/commit/8464a737eab2c2d0b6f0779e4fe63f753ba196ab))
* **cli:** Add YAML support ([39acc48](https://github.com/messageformat/messageformat/commit/39acc4860c6fa07cd2c303e91c3b738f21398a68))
* **cli:** Allow string values for options.custom-formatters ([91edcbd](https://github.com/messageformat/messageformat/commit/91edcbd05b1fcc9f20516fe38e9efc11a1405783))
* **cli:** Refactor, using yargs rather than nopt ([85419bf](https://github.com/messageformat/messageformat/commit/85419bfd41185ae05081775387102a4d33b18308))
* Always apply locale-specific checks to plural cases ([d5d746c](https://github.com/messageformat/messageformat/commit/d5d746c873504e5146d37be72bd1214b6d52c48f))
* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474d9398007cf4be0275b3ab4ba39434acda))
* Refactor as a monorepo, using Lerna ([#212](https://github.com/messageformat/messageformat/issues/212)) ([f573ffc](https://github.com/messageformat/messageformat/commit/f573ffcb1aa2fab32653d695889b0999e90dde93))


### BREAKING CHANGES

* The packages are renamed to use the @messageformat org:
- `messageformat` -> `@messageformat/core`
- `messageformat-cli` -> `@messageformat/cli`
- `messageformat-convert` -> `@messageformat/convert`
- `messageformat-loader` -> `@messageformat/webpack-loader`
- `messageformat-parser` -> `@messageformat/parser`
- `messageformat-runtime` -> `@messageformat/runtime`
* **cli:** This changes the CLI argument parsing library
completely. The API should not fundamentally change, but some parsing
differences are inevitable. In particular, it's now recommended to put
the input files/directories first, to avoid having them parsed as array
option values.
* **cli:** The --namespace option is dropped, and the output is
now always ES module.
* This removes both the pluralKeyChecks option, as well
as the disablePluralKeyChecks() method. To avoid the checks, pass in your
own plural category function.





# [3.0.0-beta.1](https://github.com/messageformat/messageformat/compare/messageformat-cli@3.0.0-beta.0...messageformat-cli@3.0.0-beta.1) (2020-04-12)

**Note:** Version bump only for package messageformat-cli





# [3.0.0-beta.0](https://github.com/messageformat/messageformat/compare/messageformat-cli@2.1.1...messageformat-cli@3.0.0-beta.0) (2019-10-15)


### Bug Fixes

* Adjust for change in MessageFormat API ([b5e34c2](https://github.com/messageformat/messageformat/commit/b5e34c2f5148f4f73c3d9506c5dc769facb5a2e1))
* **cli:** Adjust for change in MessageFormat API ([ee526b8](https://github.com/messageformat/messageformat/commit/ee526b897ce99e5354408a05910d651bff34828e))
* Update dependencies ([1fa93cb](https://github.com/messageformat/messageformat/commit/1fa93cb1fa48bbc05256171e8a27f7b934f4abb2))


### Features

* Always apply locale-specific checks to plural cases ([d5d746c](https://github.com/messageformat/messageformat/commit/d5d746c873504e5146d37be72bd1214b6d52c48f))
* **cli:** Add --options ([1722001](https://github.com/messageformat/messageformat/commit/172200118de75ef985da40d8a5b2976636b3db0f))
* **cli:** Add support for messageformat.rc.js ([8464a73](https://github.com/messageformat/messageformat/commit/8464a737eab2c2d0b6f0779e4fe63f753ba196ab))
* **cli:** Add YAML support ([39acc48](https://github.com/messageformat/messageformat/commit/39acc4860c6fa07cd2c303e91c3b738f21398a68))
* **cli:** Allow string values for options.custom-formatters ([91edcbd](https://github.com/messageformat/messageformat/commit/91edcbd05b1fcc9f20516fe38e9efc11a1405783))
* **cli:** Refactor, using yargs rather than nopt ([85419bf](https://github.com/messageformat/messageformat/commit/85419bfd41185ae05081775387102a4d33b18308))


### BREAKING CHANGES

* **cli:** This changes the CLI argument parsing library
completely. The API should not fundamentally change, but some parsing
differences are inevitable. In particular, it's now recommended to put
the input files/directories first, to avoid having them parsed as array
option values.
* **cli:** The --namespace option is dropped, and the output is
now always ES module.
* This removes both the pluralKeyChecks option, as well
as the disablePluralKeyChecks() method. To avoid the checks, pass in your
own plural category function.





## [2.1.1](https://github.com/messageformat/messageformat/compare/messageformat-cli@2.1.0...messageformat-cli@2.1.1) (2019-07-17)


### Bug Fixes

* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b5))
* Update dependencies ([c395452](https://github.com/messageformat/messageformat/commit/c395452))





# 2.1.0 (2019-03-03)


### Features

* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474))
* Refactor as a monorepo, using Lerna ([#212](https://github.com/messageformat/messageformat/issues/212)) ([f573ffc](https://github.com/messageformat/messageformat/commit/f573ffc))


# 2.0.3 (2018-12-16)


### Bug Fixes

* Automatically detect UTF-8/Latin-1 encoding for .properties files ([#206](https://github.com/messageformat/messageformat/issues/206))


# 2.0.2 (2018-08-04)


### Bug Fixes

* Don't descend into string ([#203](https://github.com/messageformat/messageformat/issues/203))


# 2.0.1 (2018-04-18)


### Bug Fixes

* Fix prepare script


# 2.0.0 (2018-04-04)


* First release
