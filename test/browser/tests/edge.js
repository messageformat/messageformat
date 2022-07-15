const { testBrowser } = require('../browserstack-runner');

const version = '80.0';
it(`Edge ${version}`, () => testBrowser('Edge', version));
