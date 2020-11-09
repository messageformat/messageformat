const { testBrowser } = require('../browserstack-runner');

const version = '71.0';
it(`Firefox ${version}`, () => testBrowser('Firefox', version));
