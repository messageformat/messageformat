const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: [
    path.resolve(__dirname, './polyfill.mjs'),
    path.resolve(__dirname, '../messageformat.js'),
    path.resolve(__dirname, '../formatters.js')
  ],
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] }
        }
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: __dirname
  }
};
