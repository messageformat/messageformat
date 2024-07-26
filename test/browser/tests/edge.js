const { testBrowser } = require('../browserstack-runner');

const version = '94.0';
it(`Edge ${version}`, () => testBrowser('Edge', version));
