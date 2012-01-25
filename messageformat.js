/*
messageformat.js

Google Style i18n/MessageFormatting
-----
v0.1.0

Google Closure has a section of i18n tools that are great, but
require the use of the Google Closure Library and its somewhat
cumbersome Java-esque coding style. That said, their i18n
tools are fantastic. This library attempts to do the same set
of things, but as a standalone library.

Closure messageformat.js: http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/i18n/messageformat.js

License: MIT | Compatible w/ Google Closure's Apache 2
CLA: Dojo

*/
(function ( root ) {


 /* Message format grammar:
 *
 * messageFormatPattern := 
 * string ( "{" messageFormatElement "}" string )*
 * 
 * messageFormatElement := argumentIndex [ "," elementFormat ]
 * 
 * elementFormat := "plural" "," pluralStyle
 *                  | "select" "," selectStyle
 * 
 * pluralStyle :=  pluralFormatPattern
 * 
 * selectStyle :=  selectFormatPattern
 * 
 * pluralFormatPattern := [ "offset" ":" offsetIndex ] pluralForms*
 * 
 * selectFormatPattern := pluralForms*
 * 
 * pluralForms := stringKey "{" ( "{" messageFormatElement "}"|string )* "}"
 *
 *
 *
 * Message example:
 *
 * I see {NUM_PEOPLE, plural, offset:1
 *         =0 {no one at all}
 *         =1 {{WHO}}
 *         one {{WHO} and one other person}
 *         other {{WHO} and # other people}}
 * in {PLACE}.
 *
 * Calling format({'NUM_PEOPLE': 2, 'WHO': 'Mark', 'PLACE': 'Athens'}) would
 * produce "I see Mark and one other person in Athens." as output.
 */

// PluralFormat port from Java
/*
  function PluralFormat ( plural_rules, locale ) {
    this.plural_rules = plural_rules || (function (n){ if ( n === 1 ) { return 0; } return 1; });
    this.locale = locale || "en";
    this.parsedValues = {};
  }

  function isRuleWhiteSpace ( ch ) {
    var c = "".charCodeAt.call( [ch], 0 );
    return (c >= 0x0009 && c <= 0x2029 &&
                (c <= 0x000D || c == 0x0020 || c == 0x0085 ||
                 c == 0x200E || c == 0x200F || c >= 0x2028));
  }

  PluralFormat.prototype.applyPattern = function applyPattern ( pttrn ) {
         pttrn = pttrn.replace(/^\s\s*         /, '').replace(/\s\s*$/, '');

        this.pattern = pttrn;
        var braceStack = 0;

        var ruleNames = {
          "none": 1,
          "one" : 1,
          "two" : 1,
          "other" : 1
        };

        // Format string has to include keywords.
        // states:
        // 0: Reading keyword.
        // 1: Reading value for preceding keyword.
        var state = 0;
        var token = "";
        var currentKeyword;
        var readSpaceAfterKeyword = false;
        for (var i = 0; i < pttrn.length; ++i) {
            var ch = pttrn.split('')[ i ];
            console.log( 'ch', ch );
            switch ( state ) {
            case 0: // Reading value.
                if (token.length === 0) {
                    readSpaceAfterKeyword = false;
                }
                if ( isRuleWhiteSpace( ch ) ) {
                    if (token.length > 0) {
                        readSpaceAfterKeyword = true;
                    }
                    // Skip leading and trailing whitespaces.
                    break;
                }
                if (ch === '{') { // End of keyword definition reached.
                    currentKeyword = token.toLowerCase();
                    if (!ruleNames[currentKeyword]) {
                        throw new Error("Malformed formatting expression. " +
                                "Unknown keyword \"" + currentKeyword +
                                "\" at position " + i + ".");
                    }
                    if (parsedValues[currentKeyword]) {
                        throw new Error("Malformed formatting expression. " +
                                "Text for case \"" + currentKeyword +
                                "\" at position " + i + " already defined!");
                    }
                    token = "";
                    braceStack++;
                    state = 1;
                    break;
                }
                if (readSpaceAfterKeyword) {
                    throw new Error("Malformed formatting expression. " +
                            "Invalid keyword definition. Character \"" + ch +
                            "\" at position " + i + " not expected!");
                }
                token += ch;
                break;
            case 1: // Reading value.
                switch (ch) {
                case '{':
                    braceStack++;
                    token += ch;
                    break;
                case '}':
                    braceStack--;
                    if (braceStack === 0) { // End of value reached.
                        this.parsedValues[currentKeyword] = token;
                        token = "";
                        state = 0;
                    } else if (braceStack < 0) {
                        throw new Error("Malformed formatting expression. " +
                                "Braces do not match.");
                    } else { // braceStack > 0
                        token += ch;
                    }
                    break;
                default:
                    token += ch;
                }
                break;
            } // switch state
        } // for loop.
        if (braceStack !== 0) {
            throw new Error(
                    "Malformed formatting expression. Braces do not match.");
        }
        if ( ! this.parsedValues.other ) {
          throw new Error("Malformed formatting expression.\n" +
                    "Value for case \"" + "other" +
                    "\" was not defined.");
        }
    };

    exports.PluralFormat = PluralFormat;*/

})( this );
