const { Builder } = require('selenium-webdriver');

const bsConfig = {
  project: 'messageformat',
  'browserstack.local': 'true',
  'browserstack.user': process.env.BROWSERSTACK_USER,
  'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
  'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER
};

const browsers = {
  chrome: {
    browserName: 'Chrome',
    browser_version: '49.0',
    os: 'Windows',
    os_version: '10'
  },
  firefox: {
    browserName: 'Firefox',
    browser_version: '66.0'
  },
  ie: {
    browserName: 'IE',
    browser_version: '11.0',
    os: 'Windows',
    os_version: '8.1'
  },
  edge: {
    browserName: 'Edge',
    browser_version: '17.0',
    os: 'Windows',
    os_version: '10'
  },
  safari: {
    browserName: 'Safari',
    browser_version: '12.0',
    os: 'OS X',
    os_version: 'Mojave'
  },
  android: {
    browserName: 'android',
    device: 'Samsung Galaxy S6',
    realMobile: 'true',
    os_version: '5.0'
  },
  ios: {
    browserName: 'iPhone',
    device: 'iPhone 6S',
    realMobile: 'true',
    os_version: '11.4'
  }
};

const id = process.env.BROWSER || 'chrome';
const browser = browsers[id];
if (!browser) throw new Error(`Unknown browser ${JSON.stringify(id)}`);

module.exports = new Builder()
  .usingServer('http://hub-cloud.browserstack.com/wd/hub')
  .withCapabilities(Object.assign({}, browser, bsConfig))
  .build();
