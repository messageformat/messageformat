const { testBrowser } = require('../browserstack-runner');

const version = '74.0';
it(`Firefox ${version}`, () => testBrowser('Firefox', version));
