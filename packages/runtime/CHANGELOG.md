# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 3.0.0-beta.0 (2019-10-15)


### Features

* Merge formatters into runtime ([1cef20b](https://github.com/messageformat/messageformat/commit/1cef20b576e14f46f268de6e9e1a688f00993f40))
* Move runtime to its package; split stringify-dependencies from it ([fbc10a5](https://github.com/messageformat/messageformat/commit/fbc10a5fed14ddde4170d4e20290497e2aaac3b9))
* Rename messageformat-messages as messageformat-runtime ([16c0a8b](https://github.com/messageformat/messageformat/commit/16c0a8b92be5bb917408df8addf00cec4ba2c9ba))
* **runtime:** Add make-plural as an explicit dependency ([95509a7](https://github.com/messageformat/messageformat/commit/95509a7c2fc0caffd4255d6e22bf4132c401ce9c))
* **runtime:** Publish as both CJS & MJS to better tree-shaking ([a3da994](https://github.com/messageformat/messageformat/commit/a3da994bab9dbdb9a87d03b26845709518eca307))
* **runtime:** Refactor, dropping class wrapper ([0ba6ebb](https://github.com/messageformat/messageformat/commit/0ba6ebb61a4d13500a836a28969204490964d429))
* Use cardinal-only plurals where appropriate ([e499b1f](https://github.com/messageformat/messageformat/commit/e499b1f81d0fce5503e4c7a19b792400d499d483))


### BREAKING CHANGES

* This drops/deprecates the messageformat-formatters
package, moving its exports to messageformat-runtime/lib/formatters.
* **runtime:** This drops the error-throwing from the non-strict
number() variant.
