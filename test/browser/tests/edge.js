const { testBrowser } = require('../browserstack-runner');

const version = '18.0';
it(`Edge ${version}`, () => testBrowser('Edge', version));
