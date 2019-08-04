# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
