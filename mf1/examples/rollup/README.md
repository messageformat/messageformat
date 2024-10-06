# Rollup Example

This uses [rollup-plugin-messageformat](http://messageformat.github.io/messageformat/rollup/) to compile the `src/messages.{en,fi}.yaml` that are imported from JS code.

To build the example, starting from the root of the repository:

```sh
npm install
npm run build

cd examples/
npm install

cd rollup/
npm run build
```

That will produce `dist/main.js` under this directory.

To see the output in a terminal, run it with Node.js:

```
node dist/main.js
```

To see the output in a browser, open `index.html` in a browser and inspect the browser's console.
