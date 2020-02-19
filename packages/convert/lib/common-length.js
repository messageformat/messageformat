// Adapted from common-prefix, available under the MIT license:
// https://github.com/hughsk/common-prefix

module.exports = function commonLength(strings, suffix) {
  const first = strings[0] || '';
  let length = first.length;
  for (let i = 1; i < strings.length; ++i) {
    const str = strings[i];
    for (let j = 0; j < length; ++j) {
      const a = first[suffix ? first.length - j - 1 : j];
      const b = str[suffix ? str.length - j - 1 : j];
      if (a !== b) {
        length = j;
        break;
      }
    }
  }
  return length;
};
