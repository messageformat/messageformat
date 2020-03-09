module.exports = {
  entry: './src/messageformat.js',
  output: {
    filename: 'messageformat.js',
    path: __dirname,
    globalObject: 'this',
    library: 'MessageFormat',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                { targets: '> 0.5%, last 2 versions, Firefox ESR, not dead' }
              ]
            ],
            plugins: [
              ['@babel/plugin-proposal-class-properties', { loose: true }]
            ]
          }
        }
      }
    ]
  }
};
