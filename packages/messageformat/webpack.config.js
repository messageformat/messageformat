module.exports = {
  entry: './lib/messageformat.js',
  output: {
    filename: 'messageformat.js',
    path: __dirname,
    globalObject: 'this',
    library: 'MessageFormat',
    libraryTarget: 'umd'
  },
  devtool: 'source-map'
};
