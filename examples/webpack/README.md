# Webpack Example

This uses [@messageformat/loader](http://messageformat.github.io/messageformat/webpack/) to compile the `src/messages.yaml` that's imported from JS code.

To build the example, run these commands in this directory:

```
npm install
npm run build
```

That will produce `dist/bundle.js` under this directory, as a minified message bundle.

To see the output in a browser, open `index.html` in a browser.
