# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.0](https://github.com/messageformat/messageformat/compare/rollup-plugin-messageformat@1.0.0...rollup-plugin-messageformat@2.0.0) (2022-07-16)

### ⚠ Breaking Changes

* Due to updated dependency requirements,
  a newer Node.js version is required: v14 or later.

# [1.0.0](https://github.com/messageformat/messageformat/compare/rollup-plugin-messageformat@1.0.0-beta.2...rollup-plugin-messageformat@1.0.0) (2021-05-13)

**Note:** Version bump only for package rollup-plugin-messageformat





# 1.0.0-beta.2 (2020-11-29)


### Features

* Rename npm packages to use the [@messageformat](https://github.com/messageformat) org ([#290](https://github.com/messageformat/messageformat/issues/290)) ([2e24133](https://github.com/messageformat/messageformat/commit/2e2413300ab000467ecbb53ecd6fa0cc7a38cbcf))
* **rollup:** Add first version, with draft of JSON & YAML support ([0606aaa](https://github.com/messageformat/messageformat/commit/0606aaa35843ae26c482a5a278f4d1fa4a2f48e2))
* **rollup:** Add loader for Latin-1 .properties files ([c610895](https://github.com/messageformat/messageformat/commit/c6108950e8f1e4fe66e99e2a6aa571e5cf7741ee))
* **rollup:** Add support for UTF-8 .properties files ([c00f0e6](https://github.com/messageformat/messageformat/commit/c00f0e60d88fa78597b29aa96fb22c212c7a7698))
* **rollup:** Refactor as TypeScript ([e8751eb](https://github.com/messageformat/messageformat/commit/e8751eb1883bbad0e1598332541a2fb0d63bbf6d))
* **rollup:** Use moduleSideEffects:false, syntheticNamedExports:true ([bf974c6](https://github.com/messageformat/messageformat/commit/bf974c60f38a447b5f125e8c1b25575c59f55612))
* Start on rollup-plugin-messageformat, adding it as a package ([cfb8444](https://github.com/messageformat/messageformat/commit/cfb8444512bd9ec04fb23d04918213783fb67947))


### BREAKING CHANGES

* The packages are renamed to use the @messageformat org:
- `messageformat` -> `@messageformat/core`
- `messageformat-cli` -> `@messageformat/cli`
- `messageformat-convert` -> `@messageformat/convert`
- `messageformat-loader` -> `@messageformat/webpack-loader`
- `messageformat-parser` -> `@messageformat/parser`
- `messageformat-runtime` -> `@messageformat/runtime`
