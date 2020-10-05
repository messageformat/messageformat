# @messageformat/date-skeleton

Tools for working with [ICU DateFormat skeletons](http://userguide.icu-project.org/formatparse/datetime)<!-- -->.

```js
import {
  DateFormatError,
  DateToken, // TS only
  getDateFormatter,
  getDateFormatterSource,
  parseDateTokens
} from '@messageformat/date-skeleton';
```

The package is released as an ES module only. If using from a CommonJS context, you may need to `import()` it, or use a module loader like [esm](https://www.npmjs.com/package/esm)<!-- -->.

Uses [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) internally. Position-dependent ICU DateFormat [patterns](https://unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns) are not supported, as they cannot be represented with Intl.DateTimeFormat options.

## Classes

| Class                                                                                                                         | Description              |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| [DateFormatError](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.dateformaterror.md) | Parent class for errors. |

## Functions

| Function                                                                                                                                                              | Description                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [getDateFormatter(locales, tokens, onError)](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.getdateformatter.md)             | Returns a date formatter function for the given locales and date skeleton                                                                                                                                                                                                                                                             |
| [getDateFormatterSource(locales, tokens, onError)](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.getdateformattersource.md) | Returns a string of JavaScript source that evaluates to a date formatter function with the same <code>(date: Date &#124; number) =&gt; string</code> signature as the function returned by [getDateFormatter()](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.getdateformatter.md)<!-- -->. |
| [parseDateTokens(src)](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.parsedatetokens.md)                                    | Parse an [ICU DateFormat skeleton](http://userguide.icu-project.org/formatparse/datetime) string into a [DateToken](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.datetoken.md) array.                                                                                                      |

## Type Aliases

| Type Alias                                                                                                        | Description                                              |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [DateToken](https://github.com/messageformat/skeletons/blob/master/docs/messageformat-date-skeleton.datetoken.md) | An object representation of a parsed date skeleton token |

---

[Messageformat] is an OpenJS Foundation project, and we follow its [Code of Conduct].

[messageformat]: https://messageformat.github.io/
[code of conduct]: https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
