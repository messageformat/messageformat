# Changelog

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
