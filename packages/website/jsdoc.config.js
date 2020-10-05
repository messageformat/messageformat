const path = require('path');

const templateDir = path.dirname(require.resolve('ink-docstrap/package.json'));

module.exports = {
  source: {
    include: [
      require.resolve('@messageformat/core/src/messageformat.js'),
      require.resolve('@messageformat/core/src/compile-module.js'),
      require.resolve('@messageformat/runtime/src/formatters.mjs'),
      require.resolve('@messageformat/runtime/src/fmt/date.mjs'),
      require.resolve('@messageformat/runtime/src/fmt/duration.mjs'),
      require.resolve('@messageformat/runtime/src/fmt/number.mjs'),
      require.resolve('@messageformat/runtime/src/fmt/time.mjs')
    ]
  },
  plugins: ['plugins/markdown'],
  opts: {
    destination: 'docs/',
    package: require.resolve('@messageformat/core/package.json'),
    readme: require.resolve('@messageformat/core/README.md'),
    template: path.resolve(templateDir, 'template'),
    tutorials: 'pages/'
  },
  templates: {
    disablePackagePath: true,
    github: '@messageformat/core/messageformat',
    favicon: [
      "<link rel='apple-touch-icon' sizes='180x180' href='logo/favicon-180.png'>",
      "<link rel='icon' type='image/png' sizes='32x32' href='logo/favicon-32.png'>"
    ],
    logoFile: 'logo/messageformat.svg',
    outputSourceFiles: true,
    search: false,
    systemName: '@messageformat/core',
    theme: 'flatly'
  }
};
