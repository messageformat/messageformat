# Changelog

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
