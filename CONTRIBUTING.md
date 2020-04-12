# Contributing to `messageformat`

We welcome all relevant issues and pull requests, and aim to provide a constructive environment. If something is not clear and you have looked at our [documentation site](https://messageformat.github.io/messageformat/v3/), then it probably counts as a bug of some sort.

Messageformat is an [OpenJS Foundation](https://openjsf.org) project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

Our current governance is pretty straightforward; our core contributors [Alex Sexton](https://github.com/SlexAxton) and [Eemeli Aro](https://github.com/eemeli) are in charge. If you'd like to have a say too, active participation is a really good way forward.

## Getting Started

The monorepo uses [Lerna](https://lerna.js.org/) for package management. Each package is included in the root package.json as a `file:` dependency, and all the dev dependencies are at the root level. This means that just running `npm install` should get you set up with everything. Note that the dependency binaries are not linked from each package, so you may need to use `lerna run` or `lerna exec` to execute scripts in packages.

## Testing & Linting

We like automated tools. In addition to our Node.js tests, our [CI](https://travis-ci.org/messageformat/messageformat) also lints the code and runs the test suite in browser environments provided by [BrowserStack](https://www.browserstack.com/open-source). To run those locally, you'll need either a WebDriver client ([ChromeDriver](https://chromedriver.chromium.org) or [geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/)), or just run the `test:serve` npm script and then open <http://localhost:5000/test/browser/> in your browser.

## Contributor License Agreement

We require all code contributions to be covered under the OpenJS Foundation's [Contributor License Agreement](https://cla.js.foundation/messageformat/messageformat). This can be done electronically and essentially ensures that you are making it clear that your contributions are your contributions and that you have the legal right to contribute them under our MIT license. If you've not previously signed the CLA, our bot will provide you with instructions for how to do so.
