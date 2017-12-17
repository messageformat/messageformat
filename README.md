<img align="right" width="100" height="100" src="logo/messageformat.svg">

[![Build Status](https://secure.travis-ci.org/messageformat/messageformat.js.svg)](http://travis-ci.org/messageformat/messageformat.js)

# messageformat

The experience and subtlety of your program's text can be important. ICU MessageFormat is a mechanism for handling both **pluralization** and **gender** in your applications. It can also lead to much better translations, as it's designed to support [all the languages](http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) included in the [Unicode CLDR](http://cldr.unicode.org/).

The ICU has an [official guide](http://userguide.icu-project.org/formatparse/messages) for the format. Messageformat supports and extends all parts of the [standard](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html), with the exception of the deprecated ChoiceFormat.

There is a good slide-deck on [Plural and Gender in Translated Messages](https://docs.google.com/presentation/d/1ZyN8-0VXmod5hbHveq-M1AeQ61Ga3BmVuahZjbmbBxo/pub?start=false&loop=false&delayms=3000#slide=id.g1bc43a82_2_14) by Markus Scherer and Mark Davis. But, again, remember that many of these problems apply even if you're only outputting english.

Please see [messageformat.github.io](https://messageformat.github.io/) for a guide to MessageFormat, more information on on the build-time use of messageformat, and the code documentation.


## What problems does it solve?

Using messageformat, you can separate your code from your text formatting, while enabling much more humane expressions. In other words, you won't need to see this anymore in your output:

> There are 1 results.  
> There are 1 result(s).  
> Number of results: 5.


## What does it look like?

With this message:

```js
> const msg = `{GENDER, select, male{He} female{She} other{They} } found
  {RES, plural, =0{no results} one{1 result} other{# results} } in the
  {CAT, selectordinal, one{#st} two{#nd} few{#rd} other{#th} } category.`;
```

You'll get these results:

```js
> const mfunc = new MessageFormat('en').compile(msg);

> mfunc({ GENDER: 'male', RES: 1, CAT: 2 })
'He found 1 result in the 2nd category.'

> mfunc({ GENDER: 'female', RES: 1, CAT: 2 })
'She found 1 result in the 2nd category.'

> mfunc({ GENDER: 'male', RES: 2, CAT: 1 })
'He found 2 results in the 1st category.'

> mfunc({ RES: 2, CAT: 2 })
'They found 2 results in the 2nd category.'
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


## Installation

### Node
```
npm install messageformat
```

```js
const MessageFormat = require('messageformat');
const mf = new MessageFormat('en');
```

### Bower
```
bower install messageformat
```

```html
<script src="path/to/bower_components/messageformat/messageformat.js"></script>
<script>
  const mf = new MessageFormat('en');
</script>
```

### Git / Direct download
The tagged [releases](https://github.com/messageformat/messageformat.js/releases) available on github.com include all of the compiled files that are kept off the master branch of the repository. When working with a clone of the repository, you'll likely want to run `make all` to generate them yourself.


## License

You may use this software under the MIT License.

## Contributor License Agreement

We require all contributions to be covered under the JS Foundation's [Contributor License Agreement](https://js.foundation/CLA/). This can be done electronically and essentially ensures that you are making it clear that your contributions are your contributions, you have the legal right to contribute and you are transferring the copyright of your works to the JavaScript Foundation.

If you are an unfamiliar contributor to the committer assessing your pull request, it is best to make it clear how you are covered by a CLA in the notes of the pull request. The committer will verify your status.

If your GitHub user id you are submitting your pull request from differs from the e-mail address which you have signed your CLA under, you should specifically note what you have your CLA filed under (and for CCLA that you are listed under your company's authorised contributors).

## Authors

* Alex Sexton - [@SlexAxton](http://twitter.com/SlexAxton) - <http://alexsexton.com/>
* Eemeli Aro - [@eemeli](http://twitter.com/eemeli_aro) - <https://github.com/eemeli>


## Credits

Thanks to:

* [Bazaarvoice](https://github.com/Bazaarvoice) - Alex's previous employer - for letting him do cool stuff like this.
* Google has an implementation that is similar in Google Closure, I tried to vet my code against many of their tests.
* Norbert Lindenberg for showing how good it can be.


## Implementations in other languages

[Jeff Hansen](https://github.com/jeffijoe) ([@jeffijoe](https://twitter.com/jeffijoe)) has written an [implementation for .NET](https://github.com/jeffijoe/messageformat.net) - it's a Portable Class Library, making it possible to use on iOS, Android, Windows Phone, and pretty much any other .NET target.


## Additional tools

[icu-converter](https://github.com/alex-dow/icu-converter) is a NodeJS tool for converting message files in the [ICU Resource Bundle](http://userguide.icu-project.org/locale/resources) format into JSON or .property files.
