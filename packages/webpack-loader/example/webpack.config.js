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
        test: [/\bmessages\.(json|ya?ml)$/, /\.properties$/],
        type: 'javascript/auto',
        loader: '@messageformat/loader',
        options: { locale: ['en', 'fi'] }
      }
    ]
  }
};
