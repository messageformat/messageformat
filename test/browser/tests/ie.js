const { testBrowser } = require('../browserstack-runner');

const version = '11.0';
it(`IE ${version}`, () => testBrowser('IE', version));
