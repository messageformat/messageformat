const { testBrowser } = require('../browserstack-runner');

const version = '78.0';
it(`Firefox ${version}`, () => testBrowser('Firefox', version));
