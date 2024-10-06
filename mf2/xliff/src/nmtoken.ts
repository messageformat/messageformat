const notNmtoken =
  /[^-.0-9:A-Za-z·\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{37D}\u{037F}-\u{1FFF}\u{200C}-\u{200D}\u{203F}-\u{2040}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]/gu;

/**
 * NMTOKEN supports the following characters:
 * ```
 * "-" | "." | [0-9] | ":" | [A-Z] | "_" | [a-z] | "·" | [#xC0-#xD6] |
 * [#xD8-#xF6] | [#xF8-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] |
 * [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] |
 * [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
 * ```
 *
 * To represent an arbitrary string in an NMTOKEN,
 * all other characters are escaped as `_01AB`,
 * i.e. a four-digit all-caps hexadecimal Unicode code point prefixed with `_`.
 *
 * To allow for separators, `.`, `:`, `_`, and `·` are each escaped with a leading `_`.
 */
export const toNmtoken = (src: string) =>
  src
    .replace(/[.:_·]/g, '_$&')
    .replace(
      notNmtoken,
      ch => '_' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
    );

/**
 * Unescape characters escaped as `_01AB`,
 * i.e. a four-digit hexadecimal Unicode code point prefixed with `_`,
 * or separators escaped with a leading `_` as `_.`, `_:`, `__`, and `_·`.
 */
export const fromNmtoken = (src: string) =>
  src
    .replace(/_([0-9A-F]{4})/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/_[.:_·]/g, '$1');
