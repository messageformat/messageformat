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
  "en" : function ( n ) {
    if ( n === 1 ) {
      return 'one';
    }
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
    "\n": "\\n"
  };

  var badChars = /(\n)|[\n]/g;
  var possible = /[\n]/;

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
    return string.replace( /#/g, '" + ('+key+') + "');
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
          s += 'r += (pf_' +
               data.pf_count +
               '[ k_' + (data.pf_count+1) + ' ] || pf_'+data.pf_count+'[ "other" ])( d );\n';
        }
        else if ( ast.key === 'plural' ) {
          s += interpMFP( ast.val, data );
          s += 'if ( pf_'+(data.pf_count)+'[ k_'+(data.pf_count+1)+' + "" ] ) {\n';
          s += 'r += pf_'+data.pf_count+'[ k_'+(data.pf_count+1)+' + "" ]( d ); \n';
          s += '}\nelse {\n';
          s += 'r += pf_' +
               data.pf_count +
               '[ MessageFormat.locale["' +
               self.locale +
               '"]( k_'+(data.pf_count+1)+' - off_'+(data.pf_count)+' ) ]( d );\n';
          s += '}\n';
        }
        return s;
      /* // Unreachable cases.
      case 'pluralStyle':
      case 'selectStyle':*/
      case 'pluralFormatPattern':
        data.pf_count = data.pf_count || 0;
        s += 'var off_'+data.pf_count+' = '+ast.offset+';\n';
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
      /* // Unreachable
      case 'pluralForms':
      */
      case 'string':
        return 'r += "' + numSub(escapeExpression(ast.val), 'k_'+data.pf_count+' - off_'+(data.pf_count-1)) + '";\n';
      default:
        throw new Error( 'Bad AST type: ' + ast.type );
    }
  }
  var out = interpMFP( ast );
  global.MessageFormat = MessageFormat;
  console.log( out );
  return (new Function( 'var MessageFormat = this.MessageFormat; return ' + out ))();
};







var input = "" +
"{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1" +
"     =0 {no one}"+
"     =1 {just {GENDER, select, male {him} female {her} other{them}}self}"+
"    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}"+
"  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}"+
"} to {GENDER, select,"+
"   male {his}"+
" female {her}"+
"  other {their}"+
"} group.";

input = "There {PLURAL_NUM_PEOPLE, plural, offset:1  =0 {isn't anyone} =1 {is just you} one{is one other person} other{are # other people}} here."

var ast = mparse.parse( input );
//console.log(JSON.stringify(ast, null, ' '));
console.log(
  (new MessageFormat(false, 'en')).compile( ast )({
    PLURAL_NUM_PEOPLE : 352,
    PERSON : "Allie Sexton",
    GENDER: "female"
  })
);

