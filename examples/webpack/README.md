# Webpack Example

This uses [@messageformat/loader](http://messageformat.github.io/messageformat/webpack/) to compile the `src/messages.yaml` that's imported from JS code.

To build the example, run this command at the root of the repository:

```
npx lerna run build --scope webpack-example
```

That will produce `dist/bundle.js` under this directory, as a minified message bundle.

To see the output in a browser, open `index.html` in a browser.
