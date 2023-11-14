# Changelog

## [4.0.0-5](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-4...messageformat@4.0.0-5) (2023-11-14)

### ⚠ Breaking Changes

* API changes, including MessageFunctionContext definition

### Features

* Include syntax (let/=/match/when) in CST ([024b256](https://github.com/messageformat/messageformat/commit/024b256ee11c3e182ce40c774bf8134d605b4906))
* Add & use asDataModel(msg: CST.Message): Message ([1d9ea9e](https://github.com/messageformat/messageformat/commit/1d9ea9eed7b6c79b9fca95ea909d4c1fd9502af0))
* Drop junk from data model ([48b42eb](https://github.com/messageformat/messageformat/commit/48b42eb1b3ba58ad47f94ac4e4454bebe73880f6))
* Make data model stricter, dropping PatternElement ([b7f43b7](https://github.com/messageformat/messageformat/commit/b7f43b76a356848cd7eabe95f972bbb2fa4822a9))
* Match spec-defined Declaration data model ([33642a9](https://github.com/messageformat/messageformat/commit/33642a900e867239c06e5b464e647b9addcce9fe))
* Drop errors from data model messages ([cc468d4](https://github.com/messageformat/messageformat/commit/cc468d41f7c39998f842af9ee4e7954f9bb99056))
* Drop quoted from Literal, as per [unicode-org/message-format-wg#443](https://github.com/unicode-org/message-format-wg/issues/443) ([ffd6b0a](https://github.com/messageformat/messageformat/commit/ffd6b0a507e4f7374a0444beee3faa297ce51c4b))
* Split resolveMessage() into format() and formatToParts() ([7701871](https://github.com/messageformat/messageformat/commit/770187150e6b7dbf0645b1e56fc13fda00f81ce6))
* Apply remaining API changes to core library ([5cd2787](https://github.com/messageformat/messageformat/commit/5cd27872a39bc97d6e85a448adf005f48f2bc79b))
* Finish up API changes, including MessageFunctionContext definition and non-core packages ([2d7344a](https://github.com/messageformat/messageformat/commit/2d7344a3da762b98e924437c879301855471c0d1))

### Bug Fixes

* Use correct scope when resolving variables ([6656c95](https://github.com/messageformat/messageformat/commit/6656c95d66414da29a332a6f5bbb225371f2b9a3))
* Satisfy api-extractor, other small fixes ([78839a9](https://github.com/messageformat/messageformat/commit/78839a9d4373b5bbb853e665c3914aa796cfc145))
* Optimizations and fixes; DRY ([793cbb3](https://github.com/messageformat/messageformat/commit/793cbb35d94db365ee9017e677d4f4a1539cbbf7))

## [4.0.0-4](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-3.cf...messageformat@4.0.0-4) (2023-06-08)

### Features

* Allow colon `:` in name-char ([unicode-org/message-format-wg#365](https://github.com/unicode-org/message-format-wg/issues/365)) ([a9b9854](https://github.com/messageformat/messageformat/commit/a9b9854cbfb242ddd26d8bd7bd2eceaec9266139))
* Drop separate syntax constructs for markup ([unicode-org/message-format-wg#371](https://github.com/unicode-org/message-format-wg/issues/371)) ([6a2261b](https://github.com/messageformat/messageformat/commit/6a2261b237bd63ae9ffab3114568ea592e6e0045))
* Support parsing reserved expressions ([unicode-org/message-format-wg#374](https://github.com/unicode-org/message-format-wg/issues/374)) ([68f4066](https://github.com/messageformat/messageformat/commit/68f406669de84b03b97de8e3924d935eb922cbb4))
* Replace `nmtoken` with `unquoted` ([unicode-org/message-format-wg#364](https://github.com/unicode-org/message-format-wg/issues/364)) ([fd68779](https://github.com/messageformat/messageformat/commit/fd68779a22c2653a3d5fc86c4399bbb76bbc8bb0))
* Add resource mode to `parseMessage()` ([#396](https://github.com/messageformat/messageformat/issues/396)) ([e7d2dff](https://github.com/messageformat/messageformat/commit/e7d2dffbefc8c1aadcef2bc60ffa24a92f1496e4))

## [4.0.0-3.cf](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-3...messageformat@4.0.0-3.cf) (2023-03-14)

* Use column-first rather than first-match selection ([f5d1bba](https://github.com/messageformat/messageformat/commit/f5d1bba7b33b697eeb73bd9de1c01320f3d43bab))

## [4.0.0-3](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-2...messageformat@4.0.0-3) (2023-03-14)

* Use `|` rather than `()` as literal quotes ([15e1fcd](https://github.com/messageformat/messageformat/commit/15e1fcd65341a5ab536a06d4401b7f488b8cdfcc))
* Retain names for catchall keys ([2d6fe76](https://github.com/messageformat/messageformat/commit/2d6fe767d11820456be997de7067470ab86fd9f1))
* Replace ParseError with MessageSyntaxError ([6fe4a11](https://github.com/messageformat/messageformat/commit/6fe4a1179676c36efe2d0c8927dc72bf3d79696d))
* Define & use MessageError where appropriate ([c87052d](https://github.com/messageformat/messageformat/commit/c87052d254fb9be7f3f7b6fc42e43bdee98f8760))
* Align fallback values with updated spec ([c65fa45](https://github.com/messageformat/messageformat/commit/c65fa454ced3437482f96cf2e88e19364d95fe78))

## [4.0.0-2](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-1...messageformat@4.0.0-2) (2022-12-08)

### Features

* Drop `RuntimeFunction.options`; provide instead `castAsBoolean()` and `castAsInteger()` ([df30cb5](https://github.com/messageformat/messageformat/commit/df30cb5bc709f372753a451e2b30513fb2c2eddc))
* Simply Runtime type, dropping intermediate object as now unnecessary ([43d8e40](https://github.com/messageformat/messageformat/commit/43d8e4077123692d7d82c48871e45892f75ed80b))
* Allow `MatchValue.p.matchSelectKey()` to return Meta values ([8403abe](https://github.com/messageformat/messageformat/commit/8403abe8a144ab5bf00c43a5312b5e7a194da5ff))

### Bug Fixes

* Minor fixes ([dd39fc4](https://github.com/messageformat/messageformat/commit/dd39fc40cdbe70b4014d717ae42f0367fd725695))

## [4.0.0-1](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-0...messageformat@4.0.0-1) (2022-10-21)

### Features

* Add message stringifier ([701fceb](https://github.com/messageformat/messageformat/commit/701fceba74c03ce9b66f05a92e3f66fe0efc2cfb))
* Accept MessageFormat instance as stringifyMessage() arg ([b7cf093](https://github.com/messageformat/messageformat/commit/b7cf093153077f9e01b18bbadafb411b4235ea19))
* Normalise markup handling ([3bdaace](https://github.com/messageformat/messageformat/commit/3bdaace572691405245627f3e14475f149aefb53))
* Local variables cannot refer to later definitions ([unicode-org/message-format-wg#305](https://github.com/unicode-org/message-format-wg/issues/305)) ([7ae83a5](https://github.com/messageformat/messageformat/commit/7ae83a58dd7fac06a8275e882a945025669e25d8))

### Bug Fixes

* Add type guard isCatchallKey(); export isText() ([cd06de8](https://github.com/messageformat/messageformat/commit/cd06de81408ee94ac339086fe871ab2625f8697d))
* Drop {} wrappers from markup-start and markup-end sources ([6d903b0](https://github.com/messageformat/messageformat/commit/6d903b02a7c36f49be214065dd788fb61ca38edd))
* Prefer local over external variables ([5b09cfe](https://github.com/messageformat/messageformat/commit/5b09cfe83e02e67a7473962290d27ca5592ff434))

## [4.0.0-0](https://github.com/messageformat/messageformat/tree/messageformat@4.0.0-0) (2022-07-16)

First release
