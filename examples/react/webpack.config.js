const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',

  /**
   * react & react-dom are externals in order to guarantee that they'll only be
   * included once in the output, as the relative links in the `package.json`
   * dependencies mess things up a bit -- otherwise we'd be breaking the
   * [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).
   *
   * To make this work, `src/index.ejs` includes <script> tags for these.
   */
  externals: { react: 'React', 'react-dom': 'ReactDOM' },

  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(en|fi)\.(json|ya?ml)$/,
        type: 'javascript/auto',
        loader: '@messageformat/loader',
        options: { locale: ['en', 'fi'] }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ minify: false }),
  ]
};
