# @messageformat/runtime

A collection of [messageformat](http://messageformat.github.io/) runtime utility functions.

```
npm install @messageformat/runtime
```

This package should be marked as a dependency for any package that publishes the output of [compileModule()](http://messageformat.github.io/messageformat/api/core.compilemodule/), as the compiled ES source output may include references to it.

For applications that bundle their output using e.g. Webpack this is not necessary.

The [`Messages` accessor class](http://messageformat.github.io/messageformat/api/runtime.messages/) is a completely optional addition.
See also [@messageformat/react](http://messageformat.github.io/messageformat/api/react/) for a React-specific solution.

This package was previously named [messageformat-runtime](https://www.npmjs.com/package/messageformat-runtime).

---

[Messageformat](https://messageformat.github.io/) is an OpenJS Foundation project, and we follow its [Code of Conduct](https://github.com/openjs-foundation/cross-project-council/blob/master/CODE_OF_CONDUCT.md).

<a href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="https://messageformat.github.io/messageformat/logo/openjsf.svg" />
</a>
