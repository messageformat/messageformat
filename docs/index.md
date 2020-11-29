---
title: Home
nav_order: 1
---

<img class="float-right mb-4 ml-4" width="120" height="120" src="{{ 'logo/messageformat.svg' | relative_url }}">
{: .my-0 }

# messageformat
{: .mt-2 }

The experience and subtlety of your program's text is important.
The messageformat project provides a complete set of tools for handling all the messages of your application, for both front-end and back-end environments; for both runtime and build-time use.
It's built around the ICU MessageFormat standard and supports [all the languages](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) included in the [Unicode CLDR](http://cldr.unicode.org/), but it can be just as useful if you're dealing with only one of them.

[ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) is a mechanism for handling both **pluralization** and **gender** in your applications.
This JavaScript project supports and extends all parts of the official Java/C++ implementation, with the exception of the deprecated ChoiceFormat.
In addition to compiling messages into JavaScript functions, it also provides tooling for making their use easy during both the build and runtime of your site or application.

**Note**: This is the documentation for messageformat v3. [Documentation for messageformat v2]({{ 'v2/' | relative_url }}) is available separately.

## What problems does it solve?

Using messageformat, you can separate your code from your text formatting, while enabling much more humane expressions.
You can build an effective workflow for UI texts and translations, keeping message sources in human-friendly formats, compiling them into JavaScript during your build phase, and making them easy to use from your application code.

Messageformat provides the tools for both starting a new project, as well as using the messages and workflows you already have set up.
**As a developer**, it gives you an easy-to-use API that's future-proof and won't lock you in, while letting you avoid the limitations that a hand-rolled system will inevitably bring.
**As a translator**, it'll conform to your existing workflows without reinventing the wheel.

## What does it look like?

Most messages are simply text, and so in MessageFormat will also appear as just that.
At the top level, the only special characters are `{}`, which surround variables that are to be replaced, along with case selectors and formatter function calls.
For instance, the message `This is {foo}` will require the parameter `foo` to be defined when it's being stringified.

The greatest benefit of MessageFormat comes from its selector support, both for numerical values

```
{count, plural, =0{Found no results} one{Found one result} other{Found # results} }
```

as well as generic selectors

```
{gender, select, male{He said} female{She said} other{They said} }
```

along with formatter functions

```
The task was {done, number, percent} complete at {t, time}.
```

For more information on the available selectors, formatters, and other details, please see our [Format Guide](guide.md).

## Why it's the right choice for you

Fundamentally, this project is built around [`@messageformat/core`](api/core.md), a compiler that turns ICU MessageFormat input into JavaScript.
The core feature that makes ours different from others is that it can do its work during your **application build**, by [compiling a set of source messages](api/core.compilemodule.md) into the string representation of an ES module.

By doing this work during the build, supporting more complex features such as [date](api/date-skeleton.md) and [number skeletons](api/number-skeleton.md) does not increase the runtime size or complexity of the messages.
This also means that we can support a **large variety of source file formats** (including JSON, YAML, Java properties, and gettext .po files) at no additional cost, optionally even converting other formats to MessageFormat before processing them.

For **library developers**, all of the various API levels from [message parsing](api/parser.md) to [React tooling](api/react.md) are separately available, with clear and minimal dependencies.
In particular, our parser is already either used by or has inspired the implementations of a number of other message formatting libraries' parsers.

<a class="float-right ml-4 my-1" href="https://openjsf.org">
<img width=200 alt="OpenJS Foundation" src="{{ 'logo/openjsf.svg' | relative_url }}" />
</a>
{: .my-0 }

It's also good to note that messageformat is a project of the [OpenJS Foundation](https://openjsf.org), and has no commercial entity behind it.
This means that all parts of the project are **open source**, and that we have no interest in creating any lock-in for you – except for what's achieved by the quality of our code.

Our **long-term goal** is to make significant parts of this project obsolete by working with the [Unicode MessageFormat Working Group](https://github.com/unicode-org/message-format-wg) and [ECMA-402](https://github.com/tc39/ecma402) to define the next evolution of the standard, and to eventually bring that to JavaScript and its `Intl` object.

## Getting Started

See the [Usage Guide](use.md) for the tools that you'll want to integrate with your build and runtime code, and the [Format Guide](guide.md) to get you started with ICU MessageFormat and our extensions to it.
On GitHub, you'll find us at [messageformat/messageformat](https://github.com/messageformat/messageformat) and on npm as [@messageformat](https://www.npmjs.com/org/messageformat).
