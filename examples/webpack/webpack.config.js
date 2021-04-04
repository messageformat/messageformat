module.exports = {
  output: { filename: 'bundle.js' },
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
