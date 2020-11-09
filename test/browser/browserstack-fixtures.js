const BrowserStack = require('browserstack-local');
const http = require('http');
const handler = require('serve-handler');

const PORT = 3000;
const bslArgs = { force: true, logFile: 'test/browser/browserstack.log' };

exports.mochaGlobalSetup = async function () {
  this.server = http.createServer((req, res) => handler(req, res));
  this.server.listen(PORT);

  console.log('\nStarting BrowserStack Local...');
  this.bsl = new BrowserStack.Local();
  await new Promise((resolve, reject) => {
    this.bsl.start(bslArgs, error => {
      if (error) {
        if (error.name === 'LocalError') {
          console.info(`Skipping BrowserStack Local start: ${error.message}`);
          resolve();
        } else reject(error);
      } else resolve();
    });
  });
};

exports.mochaGlobalTeardown = async function () {
  this.server.close();

  await new Promise(resolve => {
    if (this.bsl && this.bsl.isRunning()) {
      console.log('\nStopping BrowserStack Local...');
      this.bsl.stop(resolve);
    } else resolve();
  });
};
