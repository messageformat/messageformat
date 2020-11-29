# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-beta.1](https://github.com/messageformat/messageformat/compare/messageformat-loader@1.0.0-beta.0...messageformat-loader@1.0.0-beta.1) (2020-04-12)

**Note:** Version bump only for package messageformat-loader





# [1.0.0-beta.0](https://github.com/messageformat/messageformat/compare/messageformat-loader@0.8.1...messageformat-loader@1.0.0-beta.0) (2019-10-15)


### Bug Fixes

* Adjust for change in MessageFormat API ([b5e34c2](https://github.com/messageformat/messageformat/commit/b5e34c2f5148f4f73c3d9506c5dc769facb5a2e1))
* **lodaer:** Adjust for change in MessageFormat API ([edb6420](https://github.com/messageformat/messageformat/commit/edb64203199b8fe72827ea2cb52fbdd040cfc04e))
* Update dependencies ([1fa93cb](https://github.com/messageformat/messageformat/commit/1fa93cb1fa48bbc05256171e8a27f7b934f4abb2))


### Features

* Always apply locale-specific checks to plural cases ([d5d746c](https://github.com/messageformat/messageformat/commit/d5d746c873504e5146d37be72bd1214b6d52c48f))
* **loader:** If given multiple locales, match them to the filename ([827384f](https://github.com/messageformat/messageformat/commit/827384f9951889e449712b903f428143a20e55e0))
* **loader:** Update for changed API ([2196b43](https://github.com/messageformat/messageformat/commit/2196b43bbba3a9681488e60ad3bcb1472952c7f1))


### BREAKING CHANGES

* **loader:** This may change the identified locale for some imported
files. It probably only makes things better, but that's not a complete
certainty.
* This removes both the pluralKeyChecks option, as well
as the disablePluralKeyChecks() method. To avoid the checks, pass in your
own plural category function.





## [0.8.1](https://github.com/messageformat/messageformat/compare/messageformat-loader@0.8.0...messageformat-loader@0.8.1) (2019-07-17)


### Bug Fixes

* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b5))
* Update dependencies ([c395452](https://github.com/messageformat/messageformat/commit/c395452))





# 0.8.0 (2019-03-03)


### Bug Fixes

* **loader:** allow use without options ([messageformat/loader#10](https://github.com/messageformat/loader/issues/10)) ([f523608](https://github.com/messageformat/messageformat/commit/f523608))
* **loader:** Harmonise package.json & update dependencies ([c9b7a90](https://github.com/messageformat/messageformat/commit/c9b7a90))


### Features

* **loader:** Add convert option, using messageformat-convert ([#221](https://github.com/messageformat/messageformat/issues/221)) ([b900898](https://github.com/messageformat/messageformat/commit/b900898))
* **loader:** Add YAML support ([#222](https://github.com/messageformat/messageformat/issues/222)) ([98d7298](https://github.com/messageformat/messageformat/commit/98d7298))
* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474))


# 0.7.0 (2018-07-02)


* Loosen peerDependency on messageformat to work with 1.x and above.


# 0.6.0 (2017-07-18)


* Update for Webpack 2+
* **BREAKING:** messageformat-loader now only accepts a pure JSON string as input instead of JS. If loading a single JSON file, simply drop `json-loader` and it should work. For `multi-json-loader`, update to 0.2.0+ and it will work as well.


# 0.5.0 (2017-05-08)


* Support for `intlSupport` messageformat.js flag
