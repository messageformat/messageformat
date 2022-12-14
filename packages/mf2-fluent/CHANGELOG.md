# Changelog

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
