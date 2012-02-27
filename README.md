# pluralformat.js

The experience and subtlety of your program's text can be important. PluralFormat is a mechanism for handling both *pluralization* and *gender* in your applications. It can also lead to much better translations, as it was built by [ICU](http://icu-project.org/apiref/icu4j/com/ibm/icu/text/PluralFormat.html) in 2007 to help solve those two problems for all known [CLDR](http://cldr.unicode.org/) languages - likely all the ones you care about.

There is a good slide-deck on [Plural and Gender in Translated Messages](https://docs.google.com/present/view?id=ddsrrpj5_68gkkvv6hs) by Markus Scherer and Mark Davis. But, again, remember that many of these problems apply even if you're only outputting english.

## What problems does it solve?

A progression of strings in programs:

> There are 1 results.

> There are 1 result(s).

> Number of results: 5.

These are generally unacceptable in this day and age. Not to mention the problem expands when you consider languages with 6 different pluralization rules. You may be using something like Gettext to solve this across multiple languages, but even Gettext falls flat.


## What does it look like?

ICU bills the format as easy to read and write. It may be _more_ easy to read and write, but I'd still suggest a tool for non-programmers. It looks a lot like Java's `ChoiceFormat` - but is different in a few significant ways.


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

There is very little that needs to be repeated (until gender modifies more than one word), and there are equivalent/appropriate plural keys for every single language in the CLDR database. The syntax highlighting is less than ideal, but parsing a string like this gives you flexibility for your messages even if you're _only_ dealing with english.

## Why not Gettext?

Gettext can generally go only one level deep without hitting some serious roadblocks. For example, two plural elements in a sentence, or the combination of gender and plurals.

### This would be prohibitively difficult with Gettext

> He found 5 results in 2 categories.

> She found 1 result in 1 category.

> He found 2 results in 1 category.

It can likely be done with contexts/domains for gender and some extra plural forms work to pick contexts for the plurals, but it's less than ideal. Not to mention every translation must be completed in its entirety for every combination. That stinks too.

I tend to only use Gettext on projects that are already using it in other languages, so we can share translations, otherwise, I like to live on the wild-side and use PluralFormat.

## Version

`0.1.0`

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


## Credits

Thanks to:

* Google has an implementation that is similar in Google Closure, I tried to vet my code against many of their tests.
* Norbert Lindenberg for showing me how good it can be.
