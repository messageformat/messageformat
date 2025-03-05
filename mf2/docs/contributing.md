---
title: Contributing
---

# Contributing

We welcome all relevant issues and pull requests, and aim to provide a constructive environment.
If something is not clear and you have looked at our [documentation site](https://messageformat.github.io/),
then it probably counts as a bug of some sort.

Messageformat is an [OpenJS Foundation](https://openjsf.org) project,
and we follow its [Code of Conduct](https://code-of-conduct.openjsf.org/).

## Getting Started

The monorepo uses [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) for package management.
Each package is included in the root package.json as a workspace,
and all the dev dependencies are at the root level.
This means that just running `npm install` should get you set up with everything.

Some of the MessageFormat 2 tests rely on the conformance test data
maintained in the [unicode-org/message-format-wg](https://github.com/unicode-org/message-format-wg/tree/main/test) repository.
That's included here as a git submodule, which is required for the tests to pass:

```
git submodule update --init
```

## Contributor License Agreement

This repository is managed by EasyCLA.
Project participants must sign the free [OpenJS Foundation CLA] before making a contribution.
You only need to do this one time, and it can be signed by [individual contributors] or their [employers].

[OpenJS Foundation CLA]: https://github.com/openjs-foundation/easycla
[individual contributors]: https://github.com/openjs-foundation/easycla#sign-as-an-individual
[employers]: https://github.com/openjs-foundation/easycla#have-your-company-sign-for-you

To initiate the signature process please open a PR against this repo.
The EasyCLA bot will block the merge if we still need a CLA from you.

You can find [detailed instructions here](https://github.com/openjs-foundation/easycla).
If you have issues, please email [operations@openjsf.org](mailto:operations@openjsf.org).

If your company benefits from this project and you would like to provide essential financial support
for the systems and people that power our community,
please also consider [membership in the OpenJS Foundation](https://openjsf.org/about/join).
