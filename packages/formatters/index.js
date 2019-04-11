/**
 * @classdesc
 * Default number formatting functions in the style of ICU's
 * {@link http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html simpleArg syntax}
 * implemented using the
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl Intl}
 * object defined by ECMA-402.
 *
 * In MessageFormat source, a formatter function is called with the syntax
 * `{var, name, arg}`, where `var` is a variable, `name` is the formatter name
 * (by default, either `date`, `duration`, `number` or `time`; `spellout` and
 * `ordinal` are not supported by default), and `arg` is an optional string
 * argument.
 *
 * In JavaScript, a formatter is a function called with three parameters:
 *   - The **`value`** of the variable; this can be of any user-defined type
 *   - The current **`locale`** code
 *   - The trimmed **`arg`** string value, or `null` if not set
 *
 * As formatter functions may be used in a precompiled context, they should not
 * refer to any variables that are not defined by the function parameters or
 * within the function body. To add your own formatter, either add it to the
 * static `MessageFormat.formatters` object, or use
 * {@link MessageFormat#addFormatters} to add it to a MessageFormat instance.
 *
 * @class Formatters
 * @hideconstructor
 */

module.exports = {
  date: require('./lib/date'),
  duration: require('./lib/duration'),
  number: require('./lib/number'),
  time: require('./lib/time')
};
