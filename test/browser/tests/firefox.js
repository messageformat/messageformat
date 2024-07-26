const { testBrowser } = require('../browserstack-runner');

const version = '115.0';
it(`Firefox ${version}`, () => testBrowser('Firefox', version));
