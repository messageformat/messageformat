# @messageformat/number-skeleton

Tools for working with [ICU NumberFormat skeletons](https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md) and [patterns](http://unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns)<!-- -->.

```js
import {
  getNumberFormatter,
  getNumberFormatterSource,
  NumberFormatError,
  parseNumberPattern,
  parseNumberSkeleton,
  Skeleton, // TS only
  Unit // TS only
} from '@messageformat/number-skeleton';
```

The package is released as an ES module only. If using from a CommonJS context, you may need to `import()` it, or use a module loader like [esm](https://www.npmjs.com/package/esm)<!-- -->.

Uses [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) internally, including features provided by the [Unified API Proposal](https://github.com/tc39/proposal-unified-intl-numberformat)<!-- -->.

## Classes

| Class                                                                                                     | Description                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [NumberFormatError](https://messageformat.github.io/messageformat/api/number-skeleton.numberformaterror/) | Base class for errors. In addition to a <code>code</code> and a human-friendly <code>message</code>, may also includes the token <code>stem</code> as well as other fields. |

## Functions

| Function                                                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getNumberFormatter(locales, skeleton, currency, onError)](https://messageformat.github.io/messageformat/api/number-skeleton.getnumberformatter/)             | Returns a number formatter function for the given locales and number skeleton                                                                                                                                                                                                                                              |
| [getNumberFormatterSource(locales, skeleton, currency, onError)](https://messageformat.github.io/messageformat/api/number-skeleton.getnumberformattersource/) | Returns a string of JavaScript source that evaluates to a number formatter function with the same <code>(value: number) =&gt; string</code> signature as the function returned by [getNumberFormatter()](https://github.com/messageformat/messageformat/blob/main/docs/api/number-skeleton.getnumberformatter.md)<!-- -->. |
| [parseNumberPattern(src, currency, onError)](https://messageformat.github.io/messageformat/api/number-skeleton.parsenumberpattern/)                           | Parse an [ICU NumberFormatter pattern](http://unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns) string into a [Skeleton](https://github.com/messageformat/messageformat/blob/main/docs/api/number-skeleton.skeleton.md) structure.                                                                        |
| [parseNumberSkeleton(src, onError)](https://messageformat.github.io/messageformat/api/number-skeleton.parsenumberskeleton/)                                   | Parse an [ICU NumberFormatter skeleton](https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md) string into a [Skeleton](https://github.com/messageformat/messageformat/blob/main/docs/api/number-skeleton.skeleton.md) structure.                                                |

## Interfaces

| Interface                                                                               | Description                                                                              |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Skeleton](https://messageformat.github.io/messageformat/api/number-skeleton.skeleton/) | An object representation of a parsed string skeleton, with token values grouped by type. |

## Type Aliases

| Type Alias                                                                      | Description                                                                                                                |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Unit](https://messageformat.github.io/messageformat/api/number-skeleton.unit/) | Measurement units defined by the [Unicode CLDR](https://github.com/unicode-org/cldr/blob/d4d77a2/common/validity/unit.xml) |

---

[Messageformat] is an OpenJS Foundation project, and we follow its [Code of Conduct].

[messageformat]: https://messageformat.github.io/
[code of conduct]: https://code-of-conduct.openjsf.org/

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
