const { testBrowser } = require('../browserstack-runner');

const version = '93.0';
it(`Firefox ${version}`, () => testBrowser('Firefox', version));
