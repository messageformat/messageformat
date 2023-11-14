# Changelog

## [0.5.0](https://github.com/messageformat/messageformat/compare/@messageformat/icu-messageformat-1@0.4.0...@messageformat/icu-messageformat-1@0.5.0) (2023-11-14)

### ⚠ Breaking Changes

* API changes, including MessageFunctionContext definition

### Features

* Make data model stricter, dropping PatternElement ([b7f43b7](https://github.com/messageformat/messageformat/commit/b7f43b76a356848cd7eabe95f972bbb2fa4822a9))
* Drop quoted from Literal, as per [unicode-org/message-format-wg#443](https://github.com/unicode-org/message-format-wg/issues/443) ([ffd6b0a](https://github.com/messageformat/messageformat/commit/ffd6b0a507e4f7374a0444beee3faa297ce51c4b))
* Split resolveMessage() into format() and formatToParts() ([7701871](https://github.com/messageformat/messageformat/commit/770187150e6b7dbf0645b1e56fc13fda00f81ce6))
* Finish up API changes, including MessageFunctionContext definition and non-core packages ([2d7344a](https://github.com/messageformat/messageformat/commit/2d7344a3da762b98e924437c879301855471c0d1))

### Bug Fixes

* Optimizations and fixes; DRY ([793cbb3](https://github.com/messageformat/messageformat/commit/793cbb35d94db365ee9017e677d4f4a1539cbbf7))

## [0.4.0](https://github.com/messageformat/messageformat/compare/@messageformat/icu-messageformat-1@0.3.0...@messageformat/icu-messageformat-1@0.4.0) (2023-06-08)

### Features

* **mf2:** Drop separate syntax constructs for markup ([unicode-org/message-format-wg#371](https://github.com/unicode-org/message-format-wg/issues/371)) ([6a2261b](https://github.com/messageformat/messageformat/commit/6a2261b237bd63ae9ffab3114568ea592e6e0045))
* **mf2:** Replace `nmtoken` with `unquoted` ([unicode-org/message-format-wg#364](https://github.com/unicode-org/message-format-wg/issues/364)) ([fd68779](https://github.com/messageformat/messageformat/commit/fd68779a22c2653a3d5fc86c4399bbb76bbc8bb0))

## [0.3.0](https://github.com/messageformat/messageformat/compare/@messageformat/icu-messageformat-1@0.2.0...@messageformat/icu-messageformat-1@0.3.0) (2023-03-14)

* Simply Runtime type, dropping intermediate object as now unnecessary ([43d8e40](https://github.com/messageformat/messageformat/commit/43d8e4077123692d7d82c48871e45892f75ed80b))

## [0.2.0](https://github.com/messageformat/messageformat/compare/@messageformat/icu-messageformat-1@0.1.0...@messageformat/icu-messageformat-1@0.2.0) (2022-10-21)

### ⚠ Breaking Changes

* Rename exported functions as `mf1ToMessage()` & `mf1ToMessageData()`
* Refactor API, simplifying `mf1ToMessageData()` while generalising `mf1ToMessage()`

### Features

* Rename exported functions as mf1ToMessage() & mf1ToMessageData() ([c387893](https://github.com/messageformat/messageformat/commit/c3878938cace41f7f5ca39bbca2a7184ccb4d29f))
* Drop locale-specific CLDR category checks from mf1ToMessageData() ([7904d7f](https://github.com/messageformat/messageformat/commit/7904d7f1d21b6b8ef67bc3ed2e21f55e7e4de175))
* Refactor API, simplifying mf1ToMessageData() while generalising mf1ToMessage() ([4eb75d8](https://github.com/messageformat/messageformat/commit/4eb75d8905513b332eaf8a7a2a93778e885c54a8))

## [0.1.0](https://github.com/messageformat/messageformat/tree/@messageformat/icu-messageformat-1@0.1.0) (2022-07-16)

First release
