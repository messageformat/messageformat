# React Example

A simple, but fully functional example of using [@messageformat/react] and [@messageformat/loader] to handle localized messages, with dynamic loading of non-default locales.

[@messageformat/react]: http://messageformat.github.io/messageformat/react/
[@messageformat/loader]: http://messageformat.github.io/messageformat/webpack/

To build the example, starting from the root of the repository:

```sh
npm install
npm run build

cd examples/
npm install

cd react/
npm run build
```

That will produce output files in `dist/` under this directory.

To see the output in a browser, open `dist/index.html` in a browser.
