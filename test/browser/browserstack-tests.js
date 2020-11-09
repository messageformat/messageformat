/* eslint-env mocha */
/* eslint-disable camelcase */

const reporter = require('mocha/lib/reporters').min;
const bridgeTests = require('mocha-selenium-bridge');
const { Builder } = require('selenium-webdriver');

const PORT = 3000;
const URL = `http://localhost:${PORT}/test/browser/test.html`;

const bsConfig = {
  project: 'messageformat',
  'browserstack.local': 'true',
  'browserstack.user': process.env.BROWSERSTACK_USER,
  'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
  'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER
};

const browsers = [
  { browserName: 'Chrome', browser_version: '78.0' },
  { browserName: 'Firefox', browser_version: '71.0' },
  { browserName: 'IE', browser_version: '11.0' },
  { browserName: 'Edge', browser_version: '18.0' },
  { browserName: 'Safari', browser_version: '12.1' }
];

function buildDriver(browser) {
  const cap = Object.assign({}, browser, bsConfig);
  return new Builder()
    .usingServer('http://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities(cap)
    .build();
}

describe('Browser tests', function () {
  this.timeout(120 * 1000);

  for (const browser of browsers) {
    const version = browser.browser_version || browser.os_version;
    const title = `${browser.browserName} ${version}`;
    it(title, async () => {
      console.log(`
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Testing ${title}...`);
      const driver = buildDriver(browser);
      const code = await bridgeTests(driver, reporter, URL, { timeout: 20000 });
      driver.quit();
      if (code > 0) throw new Error(`Failed ${code} tests`);
      if (code < 0) throw new Error(`MSB error ${code}`);
    });
  }
});
