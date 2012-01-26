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
var mparse = require('./message_parser');

function MessageFormat ( pluralFunc, locale ){
  this.pluralFunc = pluralFunc;
  this.locale = locale;
}

MessageFormat.locale = {
  "en" : function () {
    return 'other';
  }
};

MessageFormat.prototype.compile = function compile ( ast ) {
  var self = this;
  // Build out our basic SafeString type
  MessageFormat.SafeString = function(string) {
    this.string = string;
  };

  MessageFormat.SafeString.prototype.toString = function() {
    return this.string.toString();
  };

  var escape = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quo;",
    "'": "&#x27;",
    "`": "&#x60;",
    "\n": "\\n"
  };

  var badChars = /&(?!\w+;\n)|[<>"'`\n]/g;
  var possible = /[&<>"'`\n]/;

  var escapeChar = function(chr) {
    return escape[chr] || "&amp;";
  };

  var escapeExpression = function(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof MessageFormat.SafeString) {
      return string.toString();
    } else if (string === null || string === false) {
      return "";
    }

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  };

  var numSub = function ( string, key ) {
    return string.replace( /#/g, '" + '+key+' + "');
  };

  MessageFormat.Utils = {
    escapeExpression: escapeExpression
  };

  var fp = {
    begin: 'function ( d ) {\nvar r = "";\n',
    end  : "return r;\n}"
  };

  function interpMFP ( ast, data ) {
    // Set some default data
    data = data || {};
    var s = '', i, tmp;

    switch ( ast.type ) {
      case 'program':
        return interpMFP( ast.program );
      case 'messageFormatPattern':
        for ( i = 0; i < ast.statements.length; ++i ) {
          s += interpMFP( ast.statements[i], data );
        }
        return fp.begin + s + fp.end;
      case 'messageFormatPatternRight':
        for ( i = 0; i < ast.statements.length; ++i ) {
          s += interpMFP( ast.statements[i], data );
        }
        return s;
      case 'messageFormatElement':
        data.pf_count = data.pf_count || 0;
        if ( ast.output ) {
          s += 'r += d["' + ast.argumentIndex + '"];\n';
        }
        else {
          s += 'var k_'+(data.pf_count+1)+'=d["' + ast.argumentIndex + '"];\n';
          s += interpMFP( ast.elementFormat, data );
        }
        return s;
      case 'elementFormat':
        if ( ast.key === 'select' ) {
          s += interpMFP( ast.val, data );
          s += 'r += pf_' +
               data.pf_count +
               '[ /*MessageFormat.locale["' +
               self.locale +
               '"](k_' + data.pf_count + ') ||*/ "other" ]( d );\n';
        }
        return s;
      case 'pluralStyle':
        return 'ps\n';
      case 'selectStyle':
        return 'ss\n';
      case 'pluralFormatPattern':
        return 'pfp\n';
      case 'selectFormatPattern':

        data.pf_count = data.pf_count || 0;
        s += 'var pf_' + data.pf_count + ' = { \n';

        for ( i = 0; i < ast.pluralForms.length; ++i ) {
          if ( tmp ) {
            s += ',\n';
          }
          else{
            tmp = 1;
          }
          s += '"' + ast.pluralForms[ i ].key + '" : ' + interpMFP( ast.pluralForms[ i ].val, 
        (function(){ var res = JSON.parse(JSON.stringify(data)); res.pf_count++; return res; })() );
        }
        s += '\n};\n';
        return s;
      case 'pluralForms':
        return 'XXXXX';
      case 'string':
        return 'r += "' + numSub(escapeExpression(ast.val), 'k_'+data.pf_count) + '";\n';
      default:
        throw new Error( 'Bad AST type: ' + ast.type );
    }
  }

  return (new Function( 'return ' + interpMFP( ast ) ))();
};







var input = "I see {NUM_PEOPLE,select,"+
          "=0{no one at all}" +
          "=1{{WHO}}" +
          "one{{WHO} and one other person}" +
          "other {{WHO}, 中国话不用彁字 and # other people, also " + 
          "{NUM_DOGS,select,"+
                      "other {# dogs}"+
          "} } } " +
  "in {PLACE}.";

var ast = mparse.parse( input );

console.log(
  (new MessageFormat(false, 'en')).compile( ast )({
    NUM_PEOPLE : 5,
    WHO : "Alex Sexton",
    PLACE : "Austin, Tx",
    NUM_DOGS: 2
  })
);

