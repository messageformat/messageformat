const { testBrowser } = require('../browserstack-runner');

const version = '78.0';
it(`Chrome ${version}`, () => testBrowser('Chrome', version));
