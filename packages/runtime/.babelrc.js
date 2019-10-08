const plugins = [['@babel/plugin-proposal-class-properties', { loose: true }]];

const envPreset = [
  '@babel/preset-env',
  { exclude: ['transform-typeof-symbol'], loose: true }
];

switch (process.env.MODULE_TYPE) {
  case 'cjs':
    break;
  case 'mjs':
    envPreset[1].modules = false;
    break;
  default:
    throw new Error('Expected "cjs" or "mjs" as MODULE_TYPE env var');
}

module.exports = {
  comments: false,
  plugins,
  presets: [envPreset]
};
