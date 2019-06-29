<div class="main-title">
<img align="right" width="100" height="100" src="https://messageformat.github.io/messageformat/logo/messageformat.svg">
<a class="badge" href="http://travis-ci.org/messageformat/messageformat"><img src="https://secure.travis-ci.org/messageformat/messageformat.svg" alt="Build Status"></a>
<h1>messageformat</h1>
</div>

The experience and subtlety of your program's text can be important. Messageformat is a mechanism for handling both **pluralization** and **gender** in your applications. It can also lead to much better translations, as it's designed to support [all the languages](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) included in the [Unicode CLDR](http://cldr.unicode.org/).

The ICU has an [official guide](http://userguide.icu-project.org/formatparse/messages) for the format. Messageformat supports and extends all parts of the [standard](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html), with the exception of the deprecated ChoiceFormat.

There is a good slide-deck on [Plural and Gender in Translated Messages](https://docs.google.com/presentation/d/1ZyN8-0VXmod5hbHveq-M1AeQ61Ga3BmVuahZjbmbBxo/pub?start=false&loop=false&delayms=3000#slide=id.g1bc43a82_2_14) by Markus Scherer and Mark Davis. But, again, remember that many of these problems apply even if you're only outputting english.

## What problems does it solve?

Using messageformat, you can separate your code from your text formatting, while enabling much more humane expressions. In other words, you won't need to see this anymore in your output:

> There are 1 results.<br>
> There are 2 result(s).<br>
> Number of results: 3.

On a more fundamental level, messageformat and its associated tools can help you build an effective workflow for UI texts and translations, keeping message sources in human-friendly formats, compiling them into JavaScript during your build phase, and making them easy to use from your application code.

## What does it look like?

With this message:

```js
const msgSrc = `{GENDER, select,
  male {He}
  female {She}
  other {They}
} found {RES, plural,
  =0 {no results}
  one {1 result}
  other {# results}
}.`;
```

You'll get these results:

```js
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
const msg = mf.compile(msgSrc);

msg({ GENDER: 'male', RES: 1 }); // 'He found 1 result.'
msg({ GENDER: 'female', RES: 1 }); // 'She found 1 result.'
msg({ GENDER: 'male', RES: 0 }); // 'He found no results.'
msg({ RES: 2 }); // 'They found 2 results.'
```

## Getting Started

To install just the core package, use:

```
npm install messageformat
```

This includes the MessageFormat compiler and a runtime accessor class that provides a slightly nicer API for working with larger numbers of messages. Our [Format Guide] will help with the ICU MessageFormat Syntax, and the [Build-time Compilation Guide] provides some options for integrating messageformat to be a part of your workflow around UI texts and translations.

[format guide]: https://messageformat.github.io/messageformat/page-guide
[build-time compilation guide]: https://messageformat.github.io/messageformat/page-build
