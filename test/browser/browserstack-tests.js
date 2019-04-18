const http = require('http');
const reporter = require('mocha/lib/reporters').min;
const bridgeTests = require('mocha-selenium-bridge');
const { Builder } = require('selenium-webdriver');
const handler = require('serve-handler');

const PORT = 3000;
const URL = `http://localhost:${PORT}/test/browser/selenium.html`;

const bsConfig = {
  project: 'messageformat',
  'browserstack.local': 'true',
  'browserstack.user': process.env.BROWSERSTACK_USER,
  'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
  'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER
};

const browsers = [
  { browserName: 'Chrome', browser_version: '49.0' },
  { browserName: 'Firefox', browser_version: '66.0' },
  { browserName: 'IE', browser_version: '11.0' },
  { browserName: 'Edge', browser_version: '17.0' }
  // { browserName: 'Safari', browser_version: '12.0' }
  // {
  //   browserName: 'android',
  //   device: 'Samsung Galaxy S6',
  //   realMobile: 'true',
  //   os_version: '5.0'
  // },
  // {
  //   browserName: 'iPhone',
  //   device: 'iPhone 6S',
  //   realMobile: 'true',
  //   os_version: '11.4'
  // }
];

function buildDriver(browser) {
  const cap = Object.assign({}, browser, bsConfig);
  return new Builder()
    .usingServer('http://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities(cap)
    .build();
}

describe('Browser tests', function() {
  this.timeout(120 * 1000);

  let server;
  before(() => {
    server = http.createServer((req, res) => handler(req, res));
    server.listen(PORT);
  });
  after(() => {
    server.close();
  });

  for (const browser of browsers) {
    const version = browser.browser_version || browser.os_version;
    const title = `${browser.browserName} ${version}`;
    it(title, async () => {
      console.log(`
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Testing ${title}...`);
      const driver = buildDriver(browser);
      const code = await bridgeTests(driver, reporter, URL);
      driver.quit();
      if (code > 0) throw new Error(`Failed ${code} tests`);
      if (code < 0) throw new Error(`MSB error ${code}`);
    });
  }
});
