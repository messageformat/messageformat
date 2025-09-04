# Changelog

## [0.13.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.12.3...@messageformat/fluent@0.13.0) (2025-09-04)

- Use updated `messageformat`.

## [0.12.3](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.12.2...@messageformat/fluent@0.12.3) (2025-05-14)

- Use updated `messageformat`.

## [0.12.2](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.12.1...@messageformat/fluent@0.12.2) (2025-05-07)

* Drop bare `NUMBER()` wrapper from selectors ([0018573](https://github.com/messageformat/messageformat/commit/001857360d4e6db20dec3254c102a59d2484f318))

## [0.12.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.11.0...@messageformat/fluent@0.12.0) (2025-05-07)

* Keep variant order from source ([a1e83e2](https://github.com/messageformat/messageformat/commit/a1e83e2d67c95efae6a84f863821cc70e648fd9a))
* Add datetime to functions ([cbd9df2](https://github.com/messageformat/messageformat/commit/cbd9df2966d9bd90749a6242f15e5bbdbc1f33bc))

## [0.11.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.10.0...@messageformat/fluent@0.11.0) (2025-03-24)

### ⚠ Breaking Changes

* Use locale, source argument order ([#442](https://github.com/messageformat/messageformat/pull/442))
* Replace `getFluentFunctions()` with `getMessageFunction()` ([#445](https://github.com/messageformat/messageformat/pull/445))

## [0.10.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.9.0...@messageformat/fluent@0.10.0) (2024-11-21)

### Features

* Add bidirectional isolation for formatted messages ([529bf87](https://github.com/messageformat/messageformat/commit/529bf879ff99b77766693d9e0a059d37df30250b))

### Bug Fixes

* Do not fallback on all `:number` and `:datetime` option resolution errors ([674f96b](https://github.com/messageformat/messageformat/commit/674f96b3ebed1ea3f645c302db878a74652ab2c0))

## [0.9.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.8.0...@messageformat/fluent@0.9.0) (2024-09-24)

* Prefix custom functions: `:fluent:message` ([030d00f](https://github.com/messageformat/messageformat/commit/030d00f5450632184913c098342169ed50ef4a77))

## [0.8.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.7.0...@messageformat/fluent@0.8.0) (2024-02-28)

* Flatten Pattern as per [unicode-org/message-format-wg#585](https://github.com/unicode-org/message-format-wg/issues/585) ([c388f5a](https://github.com/messageformat/messageformat/commit/c388f5a42b74c1e53d1ffaf1c2b3455a025e1c19))

## [0.7.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.6.0...@messageformat/fluent@0.7.0) (2024-01-07)

### ⚠ Breaking Changes

* Change module type to ES only

### Update MF2 to match upstream changes ([#414](https://github.com/messageformat/messageformat/pull/414))

* Add default-true detectNumberSelection option ([6d31d55](https://github.com/messageformat/messageformat/commit/6d31d55fec5dfc51e553629eb75f305a09b0cd76))
* Resolve message references with local variable inputs ([6f6c1a3](https://github.com/messageformat/messageformat/commit/6f6c1a30458ecc385058cf14c5bfbfadee0a1583))

## [0.6.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.5.0...@messageformat/fluent@0.6.0) (2023-11-14)

### ⚠ Breaking Changes

* API changes, including MessageFunctionContext definition

### Features

* Drop junk from data model ([48b42eb](https://github.com/messageformat/messageformat/commit/48b42eb1b3ba58ad47f94ac4e4454bebe73880f6))
* Make data model stricter, dropping PatternElement ([b7f43b7](https://github.com/messageformat/messageformat/commit/b7f43b76a356848cd7eabe95f972bbb2fa4822a9))
* Match spec-defined Declaration data model ([33642a9](https://github.com/messageformat/messageformat/commit/33642a900e867239c06e5b464e647b9addcce9fe))
* Drop quoted from Literal, as per [unicode-org/message-format-wg#443](https://github.com/unicode-org/message-format-wg/issues/443) ([ffd6b0a](https://github.com/messageformat/messageformat/commit/ffd6b0a507e4f7374a0444beee3faa297ce51c4b))
* Split resolveMessage() into format() and formatToParts() ([7701871](https://github.com/messageformat/messageformat/commit/770187150e6b7dbf0645b1e56fc13fda00f81ce6))
* Finish up API changes, including MessageFunctionContext definition and non-core packages ([2d7344a](https://github.com/messageformat/messageformat/commit/2d7344a3da762b98e924437c879301855471c0d1))

### Bug Fixes

* Satisfy api-extractor, other small fixes ([78839a9](https://github.com/messageformat/messageformat/commit/78839a9d4373b5bbb853e665c3914aa796cfc145))

## [0.5.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.4.1...@messageformat/fluent@0.5.0) (2023-06-08)

### Features

* Drop separate syntax constructs for markup ([unicode-org/message-format-wg#371](https://github.com/unicode-org/message-format-wg/issues/371)) ([6a2261b](https://github.com/messageformat/messageformat/commit/6a2261b237bd63ae9ffab3114568ea592e6e0045))
* Replace `nmtoken` with `unquoted` ([unicode-org/message-format-wg#364](https://github.com/unicode-org/message-format-wg/issues/364)) ([fd68779](https://github.com/messageformat/messageformat/commit/fd68779a22c2653a3d5fc86c4399bbb76bbc8bb0))

## [0.4.1](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.4.0...@messageformat/fluent@0.4.1) (2023-05-27)

* Update to @fluent/syntax 0.19

## [0.4.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.3.1...@messageformat/fluent@0.4.0) (2023-03-14)

* Align fallback values with updated spec ([c65fa45](https://github.com/messageformat/messageformat/commit/c65fa454ced3437482f96cf2e88e19364d95fe78))

## [0.3.1](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.3.0...@messageformat/fluent@0.3.1) (2022-12-14)

### Features

* Retain names for catchall keys ([2d6fe76](https://github.com/messageformat/messageformat/commit/2d6fe767d11820456be997de7067470ab86fd9f1))

### Bug Fixes

* Merge adjacent text elements when uplifting selectors ([7a3da47](https://github.com/messageformat/messageformat/commit/7a3da47891d0d4a0478d516c1c427a902d0fbf16))

## [0.3.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.2.0...@messageformat/fluent@0.3.0) (2022-12-08)

### Features

* Do not flatten Fluent attributes into separate top-level messages ([ceece0d](https://github.com/messageformat/messageformat/commit/ceece0da929d6746169749326ce1ccd5f2c1bd62))

## [0.2.0](https://github.com/messageformat/messageformat/compare/@messageformat/fluent@0.1.0...@messageformat/fluent@0.2.0) (2022-10-21)

### ⚠ Breaking Changes

* Rename exported functions as `fluentToResource()` & `fluentToResourceData()`

### Features

* Add messageToAst() converter ([8ec72c9](https://github.com/messageformat/messageformat/commit/8ec72c9a6907561b146b017c7e18e5aaf625c1a2))
* Add resourceToAst() converter ([68d29de](https://github.com/messageformat/messageformat/commit/68d29de095d2cc0b3d64dc6cef05910d69068953))
* Rename exported functions as fluentToResource() & fluentToResourceData() ([db749d3](https://github.com/messageformat/messageformat/commit/db749d30275fe1f8b447a319cc9a32b8a928a327))
* Allow conversion from Fluent.Pattern & Fluent.Resource ([d1cc87f](https://github.com/messageformat/messageformat/commit/d1cc87f0fa04c604c4b7a802197085ad287a5afc))
* Export messageToFluent() & resourceToFluent() ([6249935](https://github.com/messageformat/messageformat/commit/6249935744ae23c783996fa94a05cb37142d8c3f))
* Export defaultFunctionMap & FluentMessageRef ([43b9645](https://github.com/messageformat/messageformat/commit/43b96452d3bdafa8bb18c890fe4a0bc9bd547c6b))

### Bug Fixes

* **mf2:** Use "text" rather than "literal" for top-level pattern elements in Fluent & XLIFF ([9af8153](https://github.com/messageformat/messageformat/commit/9af81533bd37a67c4205e6455da34f0f3cdd2860))

## [0.1.0](https://github.com/messageformat/messageformat/tree/@messageformat/fluent@0.1.0) (2022-07-16)

First release
