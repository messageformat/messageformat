const { testBrowser } = require('../browserstack-runner');

const version = '80.0';
it(`Chrome ${version}`, () => testBrowser('Chrome', version));
