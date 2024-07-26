const { testBrowser } = require('../browserstack-runner');

const version = '94.0';
it(`Chrome ${version}`, () => testBrowser('Chrome', version));
