// This file does not contain the parser, so it can be easier to develop against
// I don't know how hard it will be to maintain both sets of code, but I wanted to
// store this away before I forgot about it.
/**
 * messageformat.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.1.0
 * @license WTFPL
 * @contributor_license Dojo CLA
*/
(function ( root ) {

  // Create the contructor function
  function MessageFormat ( locale, pluralFunc ) {

    if ( locale && pluralFunc ) {
      MessageFormat.locale[ locale ] = pluralFunc;
    }

    // Defaults
    locale = locale || "en";
    pluralFunc = pluralFunc || MessageFormat.locale[ locale ];

    // Let's just be friends.
    if ( ! pluralFunc ) {
      throw new Error( "Plural Function not found for locale: " + locale );
    }


    // Own Properties
    this.pluralFunc = pluralFunc;
    this.locale = locale;
  }

  // Set up the locales object. Add in english by default
  MessageFormat.locale = {
    "en" : function ( n ) {
      if ( n === 1 ) {
        return "one";
      }
      return "other";
    },
    "en_us" : function () {
      return this.en.apply( this, arguments );
    }
  };

  // Build out our basic SafeString type
  // more or less stolen from Handlebars by @wycats
  MessageFormat.SafeString = function( string ) {
    this.string = string;
  };

  MessageFormat.SafeString.prototype.toString = function () {
    return this.string.toString();
  };

  MessageFormat.Utils = {
    numSub : function ( string, key, depth ) {
      // make sure that it's not an escaped octothorpe
      return string.replace( /^#|[^\\]#/g, function (m) {
        var prefix = m && m.length === 2 ? m.charAt(0) : '';
        return prefix + '" + (function(){ var x = ' +
        key+';\nif( isNaN(x) ){\nthrow new Error("MessageFormat: `"+lastkey_'+depth+'+"` isnt a number.");\n}\nreturn x;\n})() + "'
      });
    },
    escapeExpression : function (string) {
      var escape = {
            "\n": "\\n"
          },
          badChars = /(\n)|[\n]/g,
          possible = /[\n]/,
          escapeChar = function(chr) {
            return escape[chr] || "&amp;";
          };

      // Don't escape SafeStrings, since they're already safe
      if ( string instanceof MessageFormat.SafeString ) {
        return string.toString();
      }
      else if ( string === null || string === false ) {
        return "";
      }

      if ( ! possible.test( string ) ) {
        return string;
      }
      return string.replace( badChars, escapeChar );
    }
  };

  var mparser = require( './lib/message_parser' );

  MessageFormat.prototype.parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  MessageFormat.prototype.precompile = function compile ( ast ) {
    var self = this,
        needOther = false,
        fp = {
      begin: 'function(d){\nvar r = "";\n',
      end  : "return r;\n}"
    };

    function interpMFP ( ast, data ) {
      // Set some default data
      data = data || {};
      var s = '', i, tmp, lastkeyname;

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
          s += 'if(!d){\nthrow new Error("MessageFormat: No data passed to function.");\n}\n';
          if ( ast.output ) {
            s += 'r += d' + ast.argumentIndex.split('.').map(function(x) {
              return '["'+x+'"]';
            }).join('') + ';\n';
          }
          else {
            lastkeyname = 'lastkey_'+(data.pf_count+1);
            s += 'var '+lastkeyname+' = "'+ast.argumentIndex+'";\n';
            s += 'var k_'+(data.pf_count+1)+'=d['+lastkeyname+'];\n';
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
            s += 'r += (pf_' +
                 data.pf_count +
                 '[ MessageFormat.locale["' +
                 self.locale +
                 '"]( k_'+(data.pf_count+1)+' - off_'+(data.pf_count)+' ) ] || pf_'+data.pf_count+'[ "other" ] )( d );\n';
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
          needOther = true;
          // We're going to simultaneously check to make sure we hit the required 'other' option.

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
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
          if ( needOther ) {
            throw new Error("No 'other' form found in pluralFormatPattern " + data.pf_count);
          }
          return s;
        case 'selectFormatPattern':

          data.pf_count = data.pf_count || 0;
          s += 'var off_'+data.pf_count+' = 0;\n';
          s += 'var pf_' + data.pf_count + ' = { \n';
          needOther = true;

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            if ( tmp ) {
              s += ',\n';
            }
            else{
              tmp = 1;
            }
            s += '"' + ast.pluralForms[ i ].key + '" : ' + interpMFP( ast.pluralForms[ i ].val,
              (function(){
                var res = JSON.parse( JSON.stringify( data ) );
                res.pf_count++;
                return res;
              })()
            );
          }
          s += '\n};\n';
          if ( needOther ) {
            throw new Error("No 'other' form found in selectFormatPattern " + data.pf_count);
          }
          return s;
        /* // Unreachable
        case 'pluralForms':
        */
        case 'string':
          return 'r += "' + MessageFormat.Utils.numSub(
            MessageFormat.Utils.escapeExpression( ast.val ),
            'k_' + data.pf_count + ' - off_' + ( data.pf_count - 1 ),
            data.pf_count
          ) + '";\n';
        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast );
  };

  MessageFormat.prototype.compile = function ( message ) {
    return (new Function( 'MessageFormat',
      'return ' +
        this.precompile(
          this.parse( message )
        )
    ))(MessageFormat);
  };


  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = MessageFormat;
    }
    exports.MessageFormat = MessageFormat;
  }
  else {
    root['MessageFormat'] = MessageFormat;
  }

})( this );
