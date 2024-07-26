const { testBrowser } = require('../browserstack-runner');

const version = '16.5';
it(`Safari ${version}`, () => testBrowser('Safari', version));
