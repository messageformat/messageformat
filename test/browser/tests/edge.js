const { testBrowser } = require('../browserstack-runner');

const version = '120.0';
it(`Edge ${version}`, () => testBrowser('Edge', version));
