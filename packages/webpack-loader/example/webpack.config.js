const { resolve } = require('path');

module.exports = {
  entry: resolve(__dirname, 'src/index.js'),
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\bmessages\.(json|ya?ml)$/,
        type: 'javascript/auto',
        loader: require.resolve('@messageformat/loader'),
        options: {
          biDiSupport: false,
          customFormatters: null,
          locale: ['en', 'fi'],
          strictNumberSign: false
        }
      }
    ]
  }
};
