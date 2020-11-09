const reporter = require('mocha/lib/reporters').min;
const bridgeTests = require('mocha-selenium-bridge');
const { Builder } = require('selenium-webdriver');

const bsConfig = {
  project: 'messageformat',
  'browserstack.local': 'true',
  'browserstack.user':
    process.env.BROWSERSTACK_USER || process.env.BROWSERSTACK_USERNAME,
  'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
  'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER
};

const PORT = 3000;
const url = `http://localhost:${PORT}/test/browser/test.html`;

/* eslint-disable camelcase */
exports.testBrowser = async function (browserName, browser_version) {
  const cap = Object.assign({ browserName, browser_version }, bsConfig);
  const driver = new Builder()
    .usingServer('http://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities(cap)
    .build();
  const code = await bridgeTests(driver, reporter, url, { timeout: 20000 });
  driver.quit();
  if (code > 0) throw new Error(`Failed ${code} tests`);
  if (code < 0) throw new Error(`MSB error ${code}`);
};
