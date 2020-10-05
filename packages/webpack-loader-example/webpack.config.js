const path = require('path');

const locale = ['en', 'fi'];

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
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
          locale,
          strictNumberSign: false
        }
      }
    ]
  }
};
