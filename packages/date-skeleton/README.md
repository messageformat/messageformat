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

| Class                                                                                               | Description              |
| --------------------------------------------------------------------------------------------------- | ------------------------ |
| [DateFormatError](https://messageformat.github.io/messageformat/api/date-skeleton.dateformaterror/) | Parent class for errors. |

## Functions

| Function                                                                                                                                              | Description                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [getDateFormatter(locales, tokens, onError)](https://messageformat.github.io/messageformat/api/date-skeleton.getdateformatter/)                       | Returns a date formatter function for the given locales and date skeleton                                                                                                                                                                                                                                                                              |
| [getDateFormatter(locales, tokens, timeZone, onError)](https://messageformat.github.io/messageformat/api/date-skeleton.getdateformatter/)             | Returns a date formatter function for the given locales and date skeleton with time zone overrride.                                                                                                                                                                                                                                                    |
| [getDateFormatterSource(locales, tokens, onError)](https://messageformat.github.io/messageformat/api/date-skeleton.getdateformattersource/)           | Returns a string of JavaScript source that evaluates to a date formatter function with the same <code>(date: Date &#124; number) =&gt; string</code> signature as the function returned by [getDateFormatter()](https://github.com/messageformat/messageformat/blob/main/docs/api/date-skeleton.getdateformatter.md)<!-- -->.                          |
| [getDateFormatterSource(locales, tokens, timeZone, onError)](https://messageformat.github.io/messageformat/api/date-skeleton.getdateformattersource/) | Returns a string of JavaScript source that evaluates to a date formatter function with the same <code>(date: Date &#124; number) =&gt; string</code> signature as the function returned by [getDateFormatter()](https://github.com/messageformat/messageformat/blob/main/docs/api/date-skeleton.getdateformatter.md) with time zone override <!-- -->. |
| [parseDateTokens(src)](https://messageformat.github.io/messageformat/api/date-skeleton.parsedatetokens/)                                              | Parse an [ICU DateFormat skeleton](http://userguide.icu-project.org/formatparse/datetime) string into a [DateToken](https://github.com/messageformat/messageformat/blob/main/docs/api/date-skeleton.datetoken.md) array.                                                                                                                               |

## Type Aliases

| Type Alias                                                                              | Description                                              |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [DateToken](https://messageformat.github.io/messageformat/api/date-skeleton.datetoken/) | An object representation of a parsed date skeleton token |

---

[Messageformat] is an OpenJS Foundation project, and we follow its [Code of Conduct].

[messageformat]: https://messageformat.github.io/
[code of conduct]: https://code-of-conduct.openjsf.org/

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
