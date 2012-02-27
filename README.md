# pluralformat.js

The experience and subtlety of your program's text can be important. PluralFormat is a mechanism for handling both *pluralization* and *gender* in your applications. It can also lead to much better translations, as it was built (by ICU - http://icu-project.org/apiref/icu4j/com/ibm/icu/text/PluralFormat.html - in 2007) to help solve those two problems for all known CLDR ( http://cldr.unicode.org/ ) languages (likely all the ones you care about).

## What problems does it solve?

A progression of strings in programs:

> There are 1 results.

> There are 1 result(s).

> Number of results: 5.

These are generally unacceptable in this day and age. Not to mention the problem expands when you consider languages with 6 different pluralization rules. You may be using something like Gettext to solve this across multiple languages, but even Gettext falls flat.

## Why not Gettext?

Gettext can generally go only one level deep without hitting some serious roadblocks. For example, two plural elements in a sentence, or the combination of gender and plurals.

### This would be prohibitively difficult with Gettext

> He found 5 results in 2 categories.

> She found 1 result in 1 category.

> He found 2 results in 1 category.

It can likely be done with contexts/domains for gender and some extra plural forms work to pick contexts for the plurals, but it's less than ideal. Not to mention every translation must be completed in its entirety for every combination. That stinks too.

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
