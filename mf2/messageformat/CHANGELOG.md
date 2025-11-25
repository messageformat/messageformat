# Changelog

## [4.0.0](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-13...messageformat@4.0.0) (2025-11-25)

* Update LDML references to [v48](https://www.unicode.org/reports/tr35/tr35-76/tr35-messageFormat.html#contents-of-part-9-messageformat)
* Fix tsconfig for `messageformat/cst` ([#460](https://github.com/messageformat/messageformat/issues/460))
* Require Node.js 20 or later with `require(esm)` support

## [4.0.0-13](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-12...messageformat@4.0.0-13) (2025-09-04)

### ⚠ Breaking Changes

* Use Object rather than Map for options & attributes in data model ([#457](https://github.com/messageformat/messageformat/issues/457))
* Drop `source` from `MessageValue` and `MessageFunctionContext`

### Features

* Rename `:math` as `:offset`, make it default
* Follow new datetime function spec ([unicode-org/message-format-wg#1078](https://github.com/unicode-org/message-format-wg/issues/1078), [unicode-org/message-format-wg#1083](https://github.com/unicode-org/message-format-wg/issues/1083))
* Add `MessageFunctionError`, drop `MessageSelectionError`
* Add :percent ([unicode-org/message-format-wg#1094](https://github.com/unicode-org/message-format-wg/issues/1094))

## [4.0.0-12](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-11...messageformat@4.0.0-12) (2025-05-14)

### Bug Fixes

* When serialising, escape literal `{}` in quoted patterns ([118007f](https://github.com/messageformat/messageformat/commit/118007f4b793e313eed8e384b066da6014615add))

## [4.0.0-11](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-10...messageformat@4.0.0-11) (2025-05-07)

### ⚠ Breaking Changes

* Drop source from `MessageExpressionPart` and `MessageMarkupPart` ([#450](https://github.com/messageformat/messageformat/issues/450), [unicode-org/message-format-wg#1061](https://github.com/unicode-org/message-format-wg/issues/1061))
  * To explicitly identify a part, set `u:id` on the placeholder rather than relying on the `source` property

## [4.0.0-10](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-9...messageformat@4.0.0-10) (2025-03-24)

### ⚠ Breaking Changes

* Publish all packages as ES-only
* Export data model types in a Model namespace
* Drop `:currency currencyDisplay=formalSymbol` option value ([unicode-org/message-format-wg#985](https://github.com/unicode-org/message-format-wg/issues/985)) ([e67de75](https://github.com/messageformat/messageformat/commit/e67de75e4965ed52b633c2811762e169541372fc))
* Remove `style=percent` from `:number` and `:integer` ([unicode-org/message-format-wg#988](https://github.com/unicode-org/message-format-wg/issues/988)) ([43f065c](https://github.com/messageformat/messageformat/commit/43f065c881d691b5ebbed844f55f09430e1a2d87))
* Drop the `notation`, `compactDisplay`, & `numberingSystem` options ([unicode-org/message-format-wg#1015](https://github.com/unicode-org/message-format-wg/issues/1015)) ([2dd8a05](https://github.com/messageformat/messageformat/commit/2dd8a05753b62a7105f33d6d27f14b3673d9a5c9))
* Drop selection from `:currency` ([unicode-org/message-format-wg#991](https://github.com/unicode-org/message-format-wg/issues/991)) ([b518ebd](https://github.com/messageformat/messageformat/commit/b518ebd5c6d4db2c8dc95a6e45fc530b324ae1cf))
* Require select option to be set by a literal value ([unicode-org/message-format-wg#1016](https://github.com/unicode-org/message-format-wg/issues/1016)) ([f6ace5a](https://github.com/messageformat/messageformat/commit/f6ace5a311216d7e4239336cecf2ea9617914a1b))
* Split functions into `DefaultFunctions` & `DraftFunctions` ([5506703](https://github.com/messageformat/messageformat/commit/5506703a25fb3d5f1d0f8bde5eb06b4ef4dba447))
* Drop `u:locale` option ([unicode-org/message-format-wg#1012](https://github.com/unicode-org/message-format-wg/issues/1012)) ([c036d97](https://github.com/messageformat/messageformat/commit/c036d97da2f706283d03b6abe0399b0924ad357e))
* Move CST functions and types under a separate 'messageformat/cst' entry point ([1ccc09f](https://github.com/messageformat/messageformat/commit/1ccc09f7d2559770f689023a41bda36b3f6fef15))
* Export `MessageFunction` from 'messageformat/functions' rather than 'messageformat' ([b21839c](https://github.com/messageformat/messageformat/commit/b21839cdd4f35051699b0798f27c49d9241f40a2))
* Drop `MessageFormat.p.resolvedOptions` ([tc39/proposal-intl-messageformat#54](https://github.com/tc39/proposal-intl-messageformat/issues/54)) ([7832edd](https://github.com/messageformat/messageformat/commit/7832eddb8635f5f6f50f78f39220d2e96ee54002))
* Use type `"text"` rather than `"literal"` for formatted text parts ([unicode-org/message-format-wg#1060](https://github.com/unicode-org/message-format-wg/issues/1060)) ([135e0fa](https://github.com/messageformat/messageformat/commit/135e0fa246fc5ed540aadaf685dc5cd68b153dd9))
* The 'messageformat/functions/utils' endpoint is merged into 'messageformat/utils',
  and functions are only published via:

      import { DefaultFunctions, DraftFunctions } from 'messageformat/functions';

  By default, on DefaultFunctions are included in MessageFormat.
  To use all available functions:

      import { MessageFormat } from 'messageformat';
      import { DraftFunctions } from 'messageformat/functions';

      const mf = new MessageFormat(locale, msgsrc, { functions: DraftFunctions });

### Features

* Implement `:unit` formatter ([unicode-org/message-format-wg#922](https://github.com/unicode-org/message-format-wg/issues/922)) ([3e3c8db](https://github.com/messageformat/messageformat/commit/3e3c8db3bb42df77a8d7b189288ece76fbfa80ef))
* Expand `name-char` and allow `name-char` as first character of `unquoted-literal` ([5dcb24c](https://github.com/messageformat/messageformat/commit/5dcb24cce2514722fc711493e68566dc4a56ac6b))
* Parametrize formatter to discriminate formatted parts ([#444](https://github.com/messageformat/messageformat/issues/444)) ([45978b3](https://github.com/messageformat/messageformat/commit/45978b3dab38283695c39e72ba14f22b6f0e41f7))

### Bug Fixes

* Be stricter about `:integer` options ([6551ab0](https://github.com/messageformat/messageformat/commit/6551ab066505cc2dbda628a7b4f8680829fcf81d))
* Replace `MessageFunctions` interface with `MessageFunction` type ([d62db35](https://github.com/messageformat/messageformat/commit/d62db3555401706dca159023c836c846d4267237))
* Do not allow for literal resolution to be customized ([369394b](https://github.com/messageformat/messageformat/commit/369394b7070b15f7d0f053fd829dac24d47e7654))
* Use null prototype for `MessageFormat.p.#functions` ([09b0197](https://github.com/messageformat/messageformat/commit/09b01970b832549a4dc94f657b0f8ba1cb4693c2))

## [4.0.0-9](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-8...messageformat@4.0.0-9) (2024-11-21)

### Features

* Apply NFC normalization to names and keys ([unicode-org/message-format-wg#885](https://github.com/unicode-org/message-format-wg/issues/885)) ([95afa46](https://github.com/messageformat/messageformat/commit/95afa46b63ba7a65af174d12e1a366f4925508bc))
* Support `u:locale` option ([unicode-org/message-format-wg#846](https://github.com/unicode-org/message-format-wg/issues/846)) ([35ab407](https://github.com/messageformat/messageformat/commit/35ab4076a95b5361595f94fdf77154dd38cb4826))
* Add bidirectional isolation for formatted messages ([529bf87](https://github.com/messageformat/messageformat/commit/529bf879ff99b77766693d9e0a059d37df30250b))
* Support `u:id` option ([unicode-org/message-format-wg#846](https://github.com/unicode-org/message-format-wg/issues/846)) ([d86b1c1](https://github.com/messageformat/messageformat/commit/d86b1c1d22379f9c83f54bd964e7addc04ad2778))
* Add `:math` function ([unicode-org/message-format-wg#932](https://github.com/unicode-org/message-format-wg/issues/932)) ([3f913fd](https://github.com/messageformat/messageformat/commit/3f913fdcab9005a9f4b36c39c080e0d11145f5e9))
* Add `:currency` function ([unicode-org/message-format-wg#915](https://github.com/unicode-org/message-format-wg/issues/915)) ([2359d3a](https://github.com/messageformat/messageformat/commit/2359d3a31524fa505ec571f7c6d94616a4a127ea))
* Always isolate when `u:dir` is set ([unicode-org/message-format-wg#942](https://github.com/unicode-org/message-format-wg/issues/942)) ([aaba7bb](https://github.com/messageformat/messageformat/commit/aaba7bb0fe177df76a5c71c422b96d194999adc9))
* Support datetime override options ([unicode-org/message-format-wg#911](https://github.com/unicode-org/message-format-wg/issues/911)) ([3622b9c](https://github.com/messageformat/messageformat/commit/3622b9c53fe259ccee4e57a8bd2d2b962a665164))

### Bug Fixes

* Exclude ALM U+061C from `name-start` ([unicode-org/message-format-wg#884](https://github.com/unicode-org/message-format-wg/issues/884)) ([da76eeb](https://github.com/messageformat/messageformat/commit/da76eebd7c322ae547b8d6b7aaeaa8efc2fcf565))
* Use spec values for `:number useGrouping` ([addb0a5](https://github.com/messageformat/messageformat/commit/addb0a5fadff57505c333a8027fb0745566a5e13))
* Use last rather than first variable name for fallback ([unicode-org/message-format-wg#903](https://github.com/unicode-org/message-format-wg/issues/903)) ([bbc7483](https://github.com/messageformat/messageformat/commit/bbc748363f9e7db04077a3a613374b29662e9256))
* Call `valueOf()` from option value utility getters ([aa3dce8](https://github.com/messageformat/messageformat/commit/aa3dce81339b5d403126209ae8c8c7b98ad0149b))
* Do not fallback on all `:number` and `:datetime` option resolution errors ([674f96b](https://github.com/messageformat/messageformat/commit/674f96b3ebed1ea3f645c302db878a74652ab2c0))
* Always use locale set in function context ([38efd20](https://github.com/messageformat/messageformat/commit/38efd2003b50da0a1af08984ddee720d6bce0a80))

## [4.0.0-8](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-7...messageformat@4.0.0-8) (2024-09-24)

### ⚠ Breaking Changes

* Flip constructor args from `(source, locales, options)` to `(locales, source, options)` ([#423](https://github.com/messageformat/messageformat/issues/423))
* Drop locales & message from `resolvedOptions()` ([#424](https://github.com/messageformat/messageformat/issues/424))
* Remove all reserved & private syntax ([unicode-org/message-format-wg#883](https://github.com/unicode-org/message-format-wg/issues/883)) ([429bd81](https://github.com/messageformat/messageformat/commit/429bd81ddfdca5d4c3532802e2439bc515a7b4f3))
* Match on variables instead of expressions ([unicode-org/message-format-wg#877](https://github.com/unicode-org/message-format-wg/issues/877)) ([653d2df](https://github.com/messageformat/messageformat/commit/653d2df3e13b6732316c790feb6dd7de0eb7c9e6))

### Features

* Support leading whitespace for complex messages ([unicode-org/message-format-wg#854](https://github.com/unicode-org/message-format-wg/issues/854)) ([714e024](https://github.com/messageformat/messageformat/commit/714e0243df7013add4823c0ffcf7f0e6e12088b5))
* Add duplicate-variant error ([unicode-org/message-format-wg#853](https://github.com/unicode-org/message-format-wg/issues/853)) ([0fb7b0c](https://github.com/messageformat/messageformat/commit/0fb7b0c3c6589fe491b7f94a4de997f9daee54a1))
* Support escapes for all of `{|}` in text and literals ([unicode-org/message-format-wg#743](https://github.com/unicode-org/message-format-wg/issues/743)) ([b011b5e](https://github.com/messageformat/messageformat/commit/b011b5e380b2c22595e3325d940dbe9deb2b4c11))
* Default to `medium` rather than `short` `dateStyle` ([unicode-org/message-format-wg#813](https://github.com/unicode-org/message-format-wg/issues/813)) ([3d1481e](https://github.com/messageformat/messageformat/commit/3d1481e3c3cc511f103d597594d4172ee85319a3))
* Keep attributes in data model, use Map for options & attributes ([unicode-org/message-format-wg#845](https://github.com/unicode-org/message-format-wg/issues/845)) ([215fdf9](https://github.com/messageformat/messageformat/commit/215fdf9d4e82779b82668dd0917adfb39274b178))
* Allow bidi controls (ALM/LRM/RLM/LRI/RLI/FSI/PDI) in whitespace & around names ([unicode-org/message-format-wg#884](https://github.com/unicode-org/message-format-wg/issues/884)) ([865ad04](https://github.com/messageformat/messageformat/commit/865ad04a7852a9363c164f651d56db2a15683e3a))

### Bug Fixes

* Verify that functions return a MessageValue ([#421](https://github.com/messageformat/messageformat/issues/421))
* Use MessageFormat WG test suite, apply upstream updates ([#422](https://github.com/messageformat/messageformat/issues/422))
* Align `:number` function to spec ([#425](https://github.com/messageformat/messageformat/issues/425))
* Use correct error codes ([db82cce](https://github.com/messageformat/messageformat/commit/db82cceddda0cf0c5f92910957720c4ff8925651))
* Escape `\{|}` when stringifying messages ([c0ee956](https://github.com/messageformat/messageformat/commit/c0ee956c7278b0bdc4ac85d1a7b12d6df20a4d83))
* Drop unused/obsolete non-formattable symbol from `:number` ([b85d17b](https://github.com/messageformat/messageformat/commit/b85d17b26f1661b0f0146a55166de41deec87626))
* Catch errors thrown during MatchSelectorKeys ([unicode-org/message-format-wg#828](https://github.com/unicode-org/message-format-wg/issues/828)) ([10e7b50](https://github.com/messageformat/messageformat/commit/10e7b50c951ca2f63545f1a0917713628fc217f5))
* Reduce regex complexity in declaration junk content parsing ([e46818d](https://github.com/messageformat/messageformat/commit/e46818d624cb8c97f434bedec7c68d3deffbd862))

## [4.0.0-7](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-6...messageformat@4.0.0-7) (2024-02-28)

### Features

* Add @attributes, with no formatting impact ([f9d96c6](https://github.com/messageformat/messageformat/commit/f9d96c63fa5e57e97b625391c99df64a414b36d6))
* Allow options on close ([unicode-org/message-format-wg#649](https://github.com/unicode-org/message-format-wg/issues/649)) ([e54254f](https://github.com/messageformat/messageformat/commit/e54254f7c158ac73bbe2b466d2c0a07953e654ad))
* Drop :plural and :ordinal functions ([unicode-org/message-format-wg#621](https://github.com/unicode-org/message-format-wg/issues/621)) ([4746620](https://github.com/messageformat/messageformat/commit/474662009a76606c7fc6f3bc60d7b33a76cbe814))
* Merge the unsupported-annotation sigil into its source in the data model ([unicode-org/message-format-wg#655](https://github.com/unicode-org/message-format-wg/issues/655)) ([067fe2f](https://github.com/messageformat/messageformat/commit/067fe2f0e973e30b0bc6c5734417365eaf66a046))
* Add :date and :time ([unicode-org/message-format-wg#659](https://github.com/unicode-org/message-format-wg/issues/659)) ([2f3f6a5](https://github.com/messageformat/messageformat/commit/2f3f6a5b9b29eab3113551b1372974c59f5b17eb))
* Add a separate parser optimised for formatting ([#418](https://github.com/messageformat/messageformat/issues/418)) ([ee1bc08](https://github.com/messageformat/messageformat/commit/ee1bc08826f0855d00a9ace4db001c06a8679983))

### Bug Fixes

* Flatten Pattern as per [unicode-org/message-format-wg#585](https://github.com/unicode-org/message-format-wg/issues/585) ([c388f5a](https://github.com/messageformat/messageformat/commit/c388f5a42b74c1e53d1ffaf1c2b3455a025e1c19))
* Drop forward-reference error, extend duplicate-declaration instead ([654693f](https://github.com/messageformat/messageformat/commit/654693f677f75530d6aaf5f68eb95e124390af71))
* Fix attributes on reserved & private annotation expressions ([2ecf174](https://github.com/messageformat/messageformat/commit/2ecf17483925cf3416f13a83ce14b86bbe5b02ae))
* Unsupported statement parsing ([86f4046](https://github.com/messageformat/messageformat/commit/86f40462c77d97bd44cb38ecd57e884094585044))

## [4.0.0-6](https://github.com/messageformat/messageformat/compare/messageformat@4.0.0-5...messageformat@4.0.0-6) (2024-01-07)

### Update MF2 to match upstream changes ([#414](https://github.com/messageformat/messageformat/pull/414))

* In Pattern, replace Text with a primitive string ([fc4db14](https://github.com/messageformat/messageformat/commit/fc4db14df9f0445f3960f3ca7d2426b0b5c8c95c))
* Refactor Expression to have arg+annotation rather than body ([c98b911](https://github.com/messageformat/messageformat/commit/c98b911688f97c94a4703a4afa698f064551f849))
* Update syntax to `.let` & `.match`, with `{{`doubled pattern braces`}}` ([ac2cc2f](https://github.com/messageformat/messageformat/commit/ac2cc2fdec81d70e811896feec9ff7bb9ffaab30))
* Replace `.let` with `.input` and `.local` ([ad608e1](https://github.com/messageformat/messageformat/commit/ad608e1451f0bedd369290d4e7fa833513962bdd))
* Add ReservedStatement ([c0dda51](https://github.com/messageformat/messageformat/commit/c0dda5188d12a86461ea103b71ac41bf23d79509))
* Support `{#markup}`, `{/markup}`, and `{#markup /}` ([c4e8261](https://github.com/messageformat/messageformat/commit/c4e8261677e499c39ac3fcc16579910037d6498f))
* Allow number-literal as unquoted value ([7ae0e10](https://github.com/messageformat/messageformat/commit/7ae0e1057e9181d1c4d584fa580b1797f14722d0))
* Add CST Identifier, with `ns:name` support ([c9e081f](https://github.com/messageformat/messageformat/commit/c9e081f4f8ee5f623a100738536344970a5e7877))
* Require annotations on all selectors ([af3c1bb](https://github.com/messageformat/messageformat/commit/af3c1bb6dcb03dad7916778aebd722d532140ad6))
* Add `:integer`, `:ordinal` and `:plural` aliases ([00d742b](https://github.com/messageformat/messageformat/commit/00d742b397d6fc49867d472cad93ef38e1a401af))
* Add a data model validator & visitor ([3de3609](https://github.com/messageformat/messageformat/commit/3de36095e3c6e98123cf97cb36f00b8184920ca5))
* Improve visitor, add MessageNode type ([e6566cf](https://github.com/messageformat/messageformat/commit/e6566cf68a02f3de155ed22726696fc1ad5bb2f8))
* Include CST reference in parsed data model, using `cst` Symbol key ([28c2e99](https://github.com/messageformat/messageformat/commit/28c2e995d958c5c5159e090a9aab638a84d23138))
* Add CST stringifier ([867c575](https://github.com/messageformat/messageformat/commit/867c57549099282e7bd6da95ca6191b341dd502f))
* Rename Reserved -> UnsupportedAnnotation ([a19397b](https://github.com/messageformat/messageformat/commit/a19397b57d755a7fa8fc43021699ddd82bab73f1))
* Rename FunctionRef -> FunctionAnnotation ([8aef253](https://github.com/messageformat/messageformat/commit/8aef2531256df40ecffd75d90ec17ab48aff7af8))
* Rename pattern/ -> expression/ ([0444f0a](https://github.com/messageformat/messageformat/commit/0444f0ab3a489549c9a5dea29fe37ed4e6f47151))
* Refactor CST Expression structure ([1d9e73f](https://github.com/messageformat/messageformat/commit/1d9e73f9d74b4fac0c545b7e25e4ceeb4dd1226f))
* Simplify formatting Context, dropping resolveExpression & resolveValue wrappers ([e22e4b7](https://github.com/messageformat/messageformat/commit/e22e4b7b581350c13e8f7581598614b490473f15))
* Treat duplicate option identifiers as a data model error ([d821d05](https://github.com/messageformat/messageformat/commit/d821d05990aebe2275bafef9851068489f39903e))
* Consider U+3000 as whitespace ([8804022](https://github.com/messageformat/messageformat/commit/880402288319f79a7e2697572e371596a84ad28a))
* Use validate() for all data model error detection ([ab0f807](https://github.com/messageformat/messageformat/commit/ab0f80715fc592d1b021c61b2520342dbb716b7d))
* Include all sigils in CST ([825c189](https://github.com/messageformat/messageformat/commit/825c18902dfd9dfe69b5d8509f7984e472e9cc37))
* Use only 'messageformat/functions' for function type exports ([207476f](https://github.com/messageformat/messageformat/commit/207476f9c3adaead437fc7c7c84ac42a3b26c1c8))
* Add default onError handler (throws) for validate() ([579501e](https://github.com/messageformat/messageformat/commit/579501eff1daf3491880c7848840aa48335ae4a9))

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
