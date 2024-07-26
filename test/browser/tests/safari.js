const { testBrowser } = require('../browserstack-runner');

const version = '16.4';
it(`Safari ${version}`, () => testBrowser('Safari', version));
