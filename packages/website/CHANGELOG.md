# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0-beta.1](https://github.com/messageformat/messageformat/compare/messageformat-website@3.0.0-beta.0...messageformat-website@3.0.0-beta.1) (2019-10-15)

**Note:** Version bump only for package messageformat-website





# [3.0.0-beta.0](https://github.com/messageformat/messageformat/compare/messageformat-website@2.1.2...messageformat-website@3.0.0-beta.0) (2019-10-15)


### Bug Fixes

* **website:** Include messageformat/compile-module in API docs ([a17bb19](https://github.com/messageformat/messageformat/commit/a17bb198c6f9db1b6c355dfe095579b9d31272f1))
* **website:** Switch from JSON to JS config for easier path resolution ([b28bc36](https://github.com/messageformat/messageformat/commit/b28bc36cb9a95e1ab6a761636afe0e6e99b74895))
* **website:** Update OpenJS Foundation logo SVG file ([9c1d85c](https://github.com/messageformat/messageformat/commit/9c1d85c685e8f36600d391dae6bd04def655a28a))
* Update dependencies ([1fa93cb](https://github.com/messageformat/messageformat/commit/1fa93cb1fa48bbc05256171e8a27f7b934f4abb2))


### Features

* **messages:** Split messageformat-messages into its own package ([b49b40b](https://github.com/messageformat/messageformat/commit/b49b40bff1a7943a8f33b677705e873af1ccca54))
* Merge formatters into runtime ([1cef20b](https://github.com/messageformat/messageformat/commit/1cef20b576e14f46f268de6e9e1a688f00993f40))
* Move runtime to its package; split stringify-dependencies from it ([fbc10a5](https://github.com/messageformat/messageformat/commit/fbc10a5fed14ddde4170d4e20290497e2aaac3b9))
* Rename messageformat-messages as messageformat-runtime ([16c0a8b](https://github.com/messageformat/messageformat/commit/16c0a8b92be5bb917408df8addf00cec4ba2c9ba))


### BREAKING CHANGES

* This drops/deprecates the messageformat-formatters
package, moving its exports to messageformat-runtime/lib/formatters.
* **messages:** Previously, messages were a part of the core
messageformat package. To use them, messageformat needed to be installed
as a runtime rather than dev dependency. For clarity, it's here
separated into its own package.





## [2.1.2](https://github.com/messageformat/messageformat/compare/messageformat-website@2.1.1...messageformat-website@2.1.2) (2019-07-17)


### Bug Fixes

* Update dependencies ([b4907b5](https://github.com/messageformat/messageformat/commit/b4907b5))
* Update dependencies ([c395452](https://github.com/messageformat/messageformat/commit/c395452))





## [2.1.1](https://github.com/messageformat/messageformat/compare/messageformat-website@2.1.0...messageformat-website@2.1.1) (2019-05-02)


### Bug Fixes

* **website:** Adjust for messageformat path change ([3c3282b](https://github.com/messageformat/messageformat/commit/3c3282b))





# 2.1.0 (2019-03-03)


### Bug Fixes

* **website:** Support building on MacOS with gsed from Homebrew ([33dfd3b](https://github.com/messageformat/messageformat/commit/33dfd3b))


### Features

* Harmonise code style with Prettier & add linting with ESLint ([#220](https://github.com/messageformat/messageformat/issues/220)) ([18bc474](https://github.com/messageformat/messageformat/commit/18bc474))
* Refactor as a monorepo, using Lerna ([#212](https://github.com/messageformat/messageformat/issues/212)) ([f573ffc](https://github.com/messageformat/messageformat/commit/f573ffc))
