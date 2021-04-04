# React Example

A simple, but fully functional example of using [@messageformat/react] and [@messageformat/loader] to handle localized messages, with dynamic loading of non-default locales.

[@messageformat/react]: http://messageformat.github.io/messageformat/react/
[@messageformat/loader]: http://messageformat.github.io/messageformat/webpack/

To install and run:

```sh
git clone https://github.com/messageformat/messageformat.git

# Need to build the core packages first
cd messageformat
npm install
npm run build

cd examples/react
npm install
npm run build

open dist/index.html
```

