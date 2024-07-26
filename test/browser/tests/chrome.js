const { testBrowser } = require('../browserstack-runner');

const version = '109.0';
it(`Chrome ${version}`, () => testBrowser('Chrome', version));
