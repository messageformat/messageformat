[![Build Status](https://secure.travis-ci.org/SlexAxton/messageformat.js.png)](http://travis-ci.org/SlexAxton/messageformat.js)

# messageformat.js

The experience and subtlety of your program's text can be important. MessageFormat (PluralFormat + SelectFormat) is a mechanism for handling both *pluralization* and *gender* in your applications. It can also lead to much better translations, as it was built by [ICU](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/MessageFormat.html) to help solve those two problems for all known [CLDR](http://cldr.unicode.org/) languages - likely all the ones you care about.

There is a good slide-deck on [Plural and Gender in Translated Messages](https://docs.google.com/presentation/d/1ZyN8-0VXmod5hbHveq-M1AeQ61Ga3BmVuahZjbmbBxo/pub?start=false&loop=false&delayms=3000#slide=id.g1bc43a82_2_14) by Markus Scherer and Mark Davis. But, again, remember that many of these problems apply even if you're only outputting english.

[See just how many different pluralization rules there are.](http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html)

MessageFormat in Java-land technically incorporates all other type formatting (and the older ChoiceFormat) directly into its messages, however, in the name of filesize, messageformat.js only strives to implement **SelectFormat** and **PluralFormat**. There are plans to pull in locale-aware **NumberFormat** parsing as a "plugin" to this library, but as of right now, it's best to pass things in preformatted (as suggested in the ICU docs).

## What problems does it solve?

A progression of strings in programs:

> There are 1 results.

> There are 1 result(s).

> Number of results: 5.

These are generally unacceptable in this day and age. Not to mention the problem expands when you consider languages with 6 different pluralization rules. You may be using something like Gettext to solve this across multiple languages, but even Gettext falls flat.


## What does it look like?

ICU bills the format as easy to read and write. It may be _more_ easy to read and write, but I'd still suggest a tool for non-programmers. It looks a lot like Java's `ChoiceFormat` - but is different in a few significant ways, most notably its addition of the `plural` keyword, and more friendly `select` syntax.


```
{GENDER, select,
    male {He}
  female {She}
   other {They}
} found {NUM_RESULTS, plural,
            one {1 result}
          other {# results}
        } in {NUM_CATEGORIES, plural,
                  one {1 category}
                other {# categories}
             }.
```

Here's a few data sets against this message:

```javascript
{
  "GENDER"         : "male",
  "NUM_RESULTS"    : 1,
  "NUM_CATEGORIES" : 2
}
> "He found 1 result in 2 categories."

{
  "GENDER"         : "female",
  "NUM_RESULTS"    : 1,
  "NUM_CATEGORIES" : 2
}
> "She found 1 result in 2 categories."

{
  "GENDER"         : "male",
  "NUM_RESULTS"    : 2,
  "NUM_CATEGORIES" : 1
}
> "He found 2 results in 1 category."

{
  "NUM_RESULTS"    : 2,
  "NUM_CATEGORIES" : 2
}
> "They found 2 results in 2 categories."
```

There is very little that needs to be repeated (until gender modifies more than one word), and there are equivalent/appropriate plural keys for every single language in the CLDR database. The syntax highlighting is less than ideal, but parsing a string like this gives you flexibility for your messages even if you're _only_ dealing with english.

## Features

* Handles arbitrary nesting of pluralization and select rules.
* Works on the server and the client.
* No i18n necessary - you can use it for just well-formed english sentences. `UX++;`
* Speed: Compiles messages to JavaScript code.
  * This is great for speed. Message formatting is just string concatenation.
  * Run a precompiler at build time and remove the need for most of the library. `filesize--;`
* Compatible with other languages that support MessageFormat
* Very whitespace tolerant.
* Supports unicode characters
* Most translation companies are beginning to be exposed to translations like this, even if it's not their core business.

## Install

### Node
```javascript
> npm install messageformat

var MessageFormat = require('messageformat');
```

### Browser
```html
<script src="/path/to/messageformat-v0.x.x.js"></script>
```

### Adding Provided Locales
```html
<!-- after the messageformat.js include, but before you need to use the locale -->
<script src="/path/to/messageformat/locales/xx_xx.js"></script>
```

TODO:: In node, we can automatically pull in all known locales for you.

### Adding Custom locales
```javascript
// Any time after MessageFormat is included
MessageFormat.locale["locale_name"] = function () { ... };

// Or during instantiation
var mf = new MessageFormat( 'locale_name', function () { ... } );
```

## Tests

These require node:

```sh
> make test

> make test-browser
```

## Build Time Compilation

You **really** should take advantage of this. It is _much_ faster than parsing in real-time.

I will eventually release a Handlebars and Require.js (r.js) plugin to do this automatically, but if you would like to output the raw javascript function, the following does that:

```javascript
var mf = new MessageFormat('en');
var js_string_represenation = mf.precompile(
  mf.parse(
    'Your {NUM, plural, one{message} other{messages}} go here.'
  )
);

// This returns an unnamed - unreferenced function that needs to be passed the
// MessageFormat object. See the source of `MessageFormat.compile` for more details.
```

### The CLI compiler

If you don't want to compile your templates programmatically, you can use the built in CLI compiler.

This tool is in early stage. It was tested on Linux and Windows, but if you find a bug, please create an issue.

#### Usage

    > [sudo] npm install -g messageformat

    > messageformat
    Usage: messageformat -l [locale] [INPUT_DIR] [OUTPUT_DIR]

        --locale, -l        locale to use [mandatory]
        --inputdir, -i      directory containings messageformat files to compile       $PWD
        --output, -o        output where messageformat will be compiled                $PWD
        --watch, -w         watch `inputdir` for change                                false
        --namespace, -ns    object in the browser containing the templates             window.i18n
        --include, -I       Glob patterns for files to include in `inputdir`           **/*.json
        --stdout, -s        Print the result in stdout instead of writing in a file    false
        --verbose, -v       Print logs for debug                                       false

If your prefer looking at an example [go there](https://github.com/SlexAxton/messageformat.js/tree/master/example/en).


`messageformat` will read every JSON files in `inputdir` and compile them to `output`.

When using the CLI, the following commands will works exactly the same:

    > messageformat --locale en ./example/en
    > messageformat --locale en ./example/en ./i18n.js
    > messageformat --locale en --inputdir ./example/en --output ./i18n.js

or even shorter

    > cd example/en
    > messageformat -l en

You can also do it with a unix pipe

    > messageformat -l en --stdout > i18n.js

Take a look at the example [inputdir](https://github.com/SlexAxton/messageformat.js/tree/master/example/en) and [output](https://github.com/SlexAxton/messageformat.js/tree/master/example/en/i18n.js)

A watch mode is available with the `--watch` or `-w` option.


#### The JSON messageformat files

The original JSON files are simple objects, with a key and a messageformat string as value, like [this one](messageformat.js/blob/master/example/en/sub/folder/plural.json):

    {
      "test": "Your {NUM, plural, one{message} other{messages}} go here."
    }

The CLI walks into `inputdir` recursively so you can structure your messageformat with [dirs and subdirs](messageformat.js/tree/master/example/en).


#### In the browser

Now that you have compiled your messageformat, you can use it in your [html](messageformat.js/blob/master/example/index.html) by adding a `<script src="index.js"></script>`.

In the browser, the global `window.i18n` is an object containing the messageformat compiled functions.

    > i18n
    Object
      colors: Object
        blue:   [ Function ]
        green:  [ Function ]
        red:    [ Function ]
      "sub/folder/plural": Object
        test:   [ Function ]

You could then use it:

    $('<div>').text( window.i18n[ 'sub/folder/plural' ].test( { NUM: 1 } ) ).appendTo('#content');

The namespace `window.i18n` could be changed with the `--namespace` or `-ns` option.

Subdirectories messageformat are available in the `window.i18n` namespace, prefixed with their relative path :

    > window.i18n['sub/folder/plural']
    Object
    * test: [ Function ]

`sub/folder` is the path, `plural` is the name of [the JSON file](messageformat.js/blob/master/example/en/sub/folder/plural.json), `test` is the key used.


A working example is available [here](messageformat.js/tree/master/example).

### No Frills

The most simple case of MessageFormat would involve no formatting. Just a string passthrough. This sounds silly, but often it's nice to always use the same i18n system when doing translations, and not everything takes variables.

```javascript
// Insantiate a MessageFormat object on your locale
var mf = new MessageFormat('en');

// Compile a message
var message = mf.compile( 'This is a message.' ); // returns a function

// You can call the function to get data out
> message();
"This is a message."

// NOTE:: if a message _does_ require data to be passed in, an error is thrown if you do not.

```

### Simple Variable Replacement

The second most simple way to use MessageFormat is for simple variable replacement. MessageFormat looks odd at first, but it's actually fairly simple. One way to think about the `{` and `}` is that every level of them bring you into and out-of `literal` and `code` mode.

By default (like in the previous example), you are just writing a literal. Then the first level of brackets brings you into one of several data-driven situations. The most simple is variable replacement.

Simply putting a variable name in between `{` and `}` will place that variable there in the output.

```javascript
// Instantiate new MessageFormat object for your locale
var mf = new MessageFormat('en');

// Compile a message
var message = mf.compile('His name is {NAME}.');

// Then send that data into the function
> message({ "NAME" : "Jed" });
"His name is Jed."

// NOTE:: it's best to try and stick to keys that would be natively
//        tolerant in your JS runtimes (think valid JS variable names).
```

### SelectFormat

`SelectFormat` is a lot like a switch statement for your messages. Most often it's used to select gender in a string. Here's an example:

```javascript
// Insantiate an instance with your language settings
var mf = new MesssageFormat('en');
// Compile a message - returns a function
var message = mf.compile('{GENDER, select, male{He} female{She} other{They}} liked this.');

// Run your message function with your data
> message({"GENDER" : "male"});
"He liked this."

> message({"GENDER" : "female"});
"She liked this."

// The 'other' key is **required** and in the case of GENDER
// it should be phrased as if you are too far away to tell the gender of the subject.
> message({});
"They liked this."

```

### PluralFormat

`PluralFormat` is a similar mechanism to `SelectFormat` (especially syntax wise), but it's specific to numbers, and the key that is chosen is generated by a _Plural Function_.

```javascript
// Insantiate a new MessageFormat object
var mf = new MessageFormat('en');

// You can use the provided locales in the `/locale` folder
// (include the file directly after including messageformat.js
var mf = new MessageFormat( 'sl' );

// OR - you can pass a custom plural function to the MessageFormat constructor function.
var mf = new Message( 'requiredCustomName', function (n) {
  if ( n === 42 ) {
    return 'many';
  }
  return 'other';
});

// Then the numbers that are passed into a compiled message will run through this function to select
// the keys. This is for the 'en' locale:
var message = mf.compile('There {NUM_RESULTS, plural, one{is one result} other{are # results}}.');

// Then the data causes the function to output:

> message({"NUM_RESULTS" : 0});
"There are 0 results."

> message({"NUM_RESULTS" : 1});
"There is one result."

> message({"NUM_RESULTS" : 100});
"There are 100 results."

```

#### Named Keys

ICU declares the 6 named keys that CLDR defines for their plural form data. Those are:

* zero
* one
* two
* few
* many
* other (**required**)

All of them are fairly straight-forward, but do remember, that for some languages, they are more loose "guidelines" than they are exact.

The only **required** key is `other`. Your compilation will throw an error if you forget this. In english, and many other languages, the logic is simple:

`If N equals 1, then ONE, otherwise OTHER`

Other languages (take a peak at `ar.js` or `sl.js`) can get much more complicated.

**Remember. English only uses `one` and `other` - so including `zero` will never get called, even when the number is 0**

The most simple (to pluralize) languages have no pluralization rules an rely solely on the `other` named key.

```
{NUM, plural,
  zero  {There are zero - in a lang that needs it.}
  one   {There is one - in a lang that has it.}
  two   {There is two - in a lang that has it.}
  few   {There are a few - in a lang that has it.}
  many  {There are many - in a lang that has it.}
  other {There is a different amount than all the other stuff above.}
}
```

#### Literal Numeric Keys

There also exists the capability to put literal numbers as keys in a select statement. These are delimited by prefixing them with the `=` character. These will match single, specific numbers. If there is a match, that branch will immediately run, and the corresponding named key **will not** also run.

There are plenty of legitimate uses for this, especially when considering base cases and more pleasant language. But if you're a Douglas Adams fan, might use it like so:

```
You have {NUM_TASKS, plural,
            one {one task}
            other {# tasks}
            =42 {the answer to the life, the universe and everything tasks}
         } remaining.
```

When `NUM_TASKS` is 42, this outputs smiles. Remember, these have priority over the named keys.

### PluralFormat - offset extension

ICU provided the ability to extend existing select and plural functionality, and the only official extension (that I could find) is the `offset` extension.

It goes after the `plural` declaration, and is used to generate sentences that break up a number into multiple sections. For instance:

> You and 4 others added this to their profiles.

In this case, the total number of people who added 'this' to their profiles is actually 5. We can use the `offset` extension to help us with this.

```javascript
var mf = new MessageFormat('en');

// For simplicity's sake, let's assume the base case here isn't silly.
// The test suite has a bigger offset example at the bottom
// Let's also assume neutral gender for the same reason

// Set the offset to 1
var message = mf.compile(
  'You {NUM_ADDS, plural, offset:1' +
          '=0{didnt add this to your profile}' + // Number literals, with a `=` do **NOT** use
          'zero{added this to your profile}' +   //   the offset value
          'one{and one other person added this to their profile}' +
          'other{and # others added this to their profiles}' +
      '}.'
);

// Tip: I like to consider the `=` prefixed number literals as more of an "inductive step"
// e.g. in this case, since (0 - 1) is _negative_ 1, we want to handle that base case.

> message({"NUM_ADDS" : 0 });
"You didnt add this to your profile."

> message({"NUM_ADDS" : 1 });
"You added this to your profile."

> message({"NUM_ADDS" : 2 });
"You and one other person added this to their profile."

> message({"NUM_ADDS" : 3 });
"You and 3 others added this to their profile."

```

### Nesting

Very simply, you can nest both `SelectFormat` blocks into `PluralFormat` blocks, and visa-versa, as deeply as you'd like. Simply start the new block directly inside:

```
{SEL1, select,
  other {{PLUR1, plural,
          one {1}
          other {{SEL2, select,
                  other {deep in the heart.}
                }}
        }}
}
```

### Escaping

messageformat.js tries to a good job of being tolerant of as much as possible, but some characters, like the ones used the actual MessageFormat spec itself, must be escaped to be a part of your string.

For `{`, `}` and `#` (only inside of a select value) literals, just escape them with a backslash. (If you are in a JS string, you'll need to escape the escape backslash so it'll look like two).

```javascript
// Technically, it's just:

\{\}\#

// But in practice, since you're often dealing with string literals, it looks more like

var msg = mf.compile("\\{ {S, select, other{# is a \\#}} \\}");

> msg({S:5});
"{ 5 is a # }"
```

## Why not Gettext?

Gettext can generally go only one level deep without hitting some serious roadblocks. For example, two plural elements in a sentence, or the combination of gender and plurals.

### This would be prohibitively difficult with Gettext

> He found 5 results in 2 categories.

> She found 1 result in 1 category.

> He found 2 results in 1 category.

It can likely be done with contexts/domains for gender and some extra plural forms work to pick contexts for the plurals, but it's less than ideal. Not to mention every translation must be completed in its entirety for every combination. That stinks too.

You can easily mix Gettext and MessageFormat by storing MessageFormat strings in your .po files. However, I would stop using the built in plural functions of Gettext.

I tend to only use Gettext on projects that are already using it in other languages, so we can share translations, otherwise, I like to live on the wild-side and use PluralFormat and SelectFormat.

Most Gettext tools will look up the Plural Forms for a given locale for you. This is also the opinion of PluralFormat. The library should just contain the known plural forms of every locale, and not force translators to reinput this information each time.

## Version

`0.1.8`

## TODO

* First and foremost - we need to get a standalone `NumberFormat` implementation - I'll probably port Google Closure's good implementation to not need Closure ASAP
* Get all locale Plural Form Function data available in a folder - I have the base line for a few for now, and will try to generate the rest soon.
* Create a tool to help translators generate these.
* Create a transport standard/mechanism - a way to load in different languages, and to exchange this data (like .po files for gettext)
* Template integration - I specifically want to make a build time handlebars.js plugin to build this logic into the template builds.

## License

You may use this software under the WTFPL.

You may contribute to this software under the Dojo CLA - <http://dojofoundation.org/about/cla>


## Author

* Alex Sexton - [@SlexAxton](http://twitter.com/SlexAxton) - <http://alexsexton.com/>

## Major Contributors

* Eemeli Aro - [@eemeli](https://github.com/eemeli)

## Credits

Thanks to:

* [Bazaarvoice](https://github.com/Bazaarvoice) - my employer - for letting me do cool stuff like this.
* Google has an implementation that is similar in Google Closure, I tried to vet my code against many of their tests.
* Norbert Lindenberg for showing me how good it can be.
