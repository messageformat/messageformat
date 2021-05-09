// Because we need `allowDeclareFields: true`, we can't use
// @babel/preset-typescript as it'd get run _after_ the class-properties
// plugin, so we mess around like this. Once we can drop Node.js 10 support,
// we can also drop the class-properties plugin, and that'll allow for
// simplifying this.

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react'
  ],
  overrides: [
    {
      test: /\.js$/,
      plugins: ['@babel/plugin-proposal-class-properties']
    },
    {
      test: /\.ts$/,
      plugins: [
        'babel-plugin-const-enum',
        ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
        '@babel/plugin-proposal-class-properties'
      ]
    },
    {
      test: /\.tsx$/,
      plugins: [
        [
          '@babel/plugin-transform-typescript',
          { allowDeclareFields: true, isTSX: true }
        ],
        '@babel/plugin-proposal-class-properties'
      ]
    }
  ]
};
