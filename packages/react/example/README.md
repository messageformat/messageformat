# @messageformat/react-example

A simple, but fully functional example of using [@messageformat/core], [@messageformat/react], and [@messageformat/loader] to handle localized messages, with dynamic loading of non-default locales.

[@messageformat/core]: https://www.npmjs.com/package/@messageformat/core
[@messageformat/react]: https://www.npmjs.com/package/@messageformat/react
[@messageformat/loader]: https://www.npmjs.com/package/@messageformat/loader

To install and run:

```sh
git clone https://github.com/messageformat/messageformat.git

# Need to build the core packages first
cd messageformat
npm install
npm run build

cd packages/react/example
npm install
npm run build

open dist/index.html
```

Note that `'react'` and `'react-dom'` are not included in the example's `package.json`. This is intentional, because the `@messageformat/react` dependency is a relative link, and we need to make sure that we don't end up with two different React instances -- otherwise we'd be breaking the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html).
