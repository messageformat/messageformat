const { testBrowser } = require('../browserstack-runner');

const version = '12.1';
it(`Safari ${version}`, () => testBrowser('Safari', version));
