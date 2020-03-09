const R0 = [
  { src: /[%#]{(\w+)}/g, tgt: '\x02$1\x03' },
  { src: /[\\{}#]/g, tgt: '\\$&' },
  { src: /\x02/g, tgt: '{' },
  { src: /\x03/g, tgt: '}' }
];

module.exports = function applyReplacements(msg, { replacements }) {
  if (!msg) return '';
  const R = replacements || R0;
  return R.reduce((msg, { src, tgt }) => msg.replace(src, tgt), String(msg));
};
