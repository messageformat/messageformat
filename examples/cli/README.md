# CLI Example

This uses [@messageformat/cli](http://messageformat.github.io/messageformat/cli/) to compile the ES module `message.mjs` from the English and French message source files under `messages/`.

To build the example, run this command at the root of the repository:

```
npx lerna run build --scope cli-example
```

That will produce two files in this directory:

- `messages.mjs` is the direct output of @messageformat/cli, and
- `bundle.mjs` is a bundling of the above with its dependencies.

To see the output in a browser, serve this directory over HTTP and open `index.html`.
Probably the easiest command to serve files locally is:

```
python3 -m http.server
```

The bundler is needed for most browsers, as using `messages.mjs` directly in a browser requires import map support.
If your browser does (Chrome 89 or later), you may edit `index.html` to import `messages.mjs` rather than `bundle.mjs`.
