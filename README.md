<div class="main-title">
<img align="right" width="100" height="100" src="logo/messageformat.svg">
<a class="badge" href="http://travis-ci.org/messageformat/messageformat.js"><img src="https://secure.travis-ci.org/messageformat/messageformat.js.svg" alt="Build Status"></a>
<h1>messageformat</h1>
</div>

The experience and subtlety of your program's text can be important. Messageformat is a mechanism for handling both **pluralization** and **gender** in your applications. It can also lead to much better translations, as it's designed to support [all the languages](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) included in the [Unicode CLDR](http://cldr.unicode.org/).

The ICU has an [official guide](http://userguide.icu-project.org/formatparse/messages) for the format. Messageformat supports and extends all parts of the [standard](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html), with the exception of the deprecated ChoiceFormat.

There is a good slide-deck on [Plural and Gender in Translated Messages](https://docs.google.com/presentation/d/1ZyN8-0VXmod5hbHveq-M1AeQ61Ga3BmVuahZjbmbBxo/pub?start=false&loop=false&delayms=3000#slide=id.g1bc43a82_2_14) by Markus Scherer and Mark Davis. But, again, remember that many of these problems apply even if you're only outputting english.


## Installation

```
npm install messageformat
```

```js
import MessageFormat from 'messageformat'
const mf = new MessageFormat('en')
```


## What problems does it solve?

Using messageformat, you can separate your code from your text formatting, while enabling much more humane expressions. In other words, you won't need to see this anymore in your output:

> There are 1 results.  
> There are 1 result(s).  
> Number of results: 5.


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
}.`
```

You'll get these results:

```js
const msg = new MessageFormat('en').compile(msgSrc)

msg({ GENDER: 'male', RES: 1 })
// 'He found 1 result.'

msg({ GENDER: 'female', RES: 1 })
// 'She found 1 result.'

msg({ GENDER: 'male', RES: 2 })
// 'He found 2 results.'

msg({ RES: 2 })
// 'They found 2 results.'
```


## Features

* Handles arbitrary nesting of pluralization and select rules
* Supports all ~466 languages included in the Unicode CLDR
* Works on the server and the client
* Remarkably useful even for single-language use
* Speed & efficiency: Can pre-compile messages to JavaScript code
  * Great for speed: message formatting is just string concatenation
* Compatible with other MessageFormat implementations
* Extendable with custom formatting functions
* Very whitespace tolerant
* Supports Unicode
