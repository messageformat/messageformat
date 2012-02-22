/**
 * pluralformat.js
 *
 * ICU PluralFormat for JavaScript
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.1.0
 * @license WTFPL
 * @contributor_license Dojo CLA
*/
(function ( root ) {

  // Create the contructor function
  function PluralFormat ( locale, pluralFunc ) {
    // Defaults
    locale = locale || "en";
    pluralFunc = pluralFunc || PluralFormat.locale[ locale ];

    // Let's just be friends.
    if ( ! pluralFunc ) {
      throw new Error( "Plural Function not found for locale: " + locale );
    }

    // Own Properties
    this.pluralFunc = pluralFunc;
    this.locale = locale;
  }

  // Set up the locales object. Add in english by default
  PluralFormat.locale = {
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
  PluralFormat.SafeString = function( string ) {
    this.string = string;
  };

  PluralFormat.SafeString.prototype.toString = function () {
    return this.string.toString();
  };

  PluralFormat.Utils = {
    numSub : function ( string, key ) {
      return string.replace( /#/g, '" + ('+key+') + "');
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
      if ( string instanceof PluralFormat.SafeString ) {
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

  var mparser = require( './message_parser' );

  PluralFormat.prototype.parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  PluralFormat.prototype.precompile = function compile ( ast ) {
    var self = this,
        fp = {
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
            s += 'r += (pf_' +
                 data.pf_count +
                 '[ PluralFormat.locale["' +
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
              (function(){
                var res = JSON.parse( JSON.stringify( data ) );
                res.pf_count++;
                return res;
              })()
            );
          }
          s += '\n};\n';
          return s;
        /* // Unreachable
        case 'pluralForms':
        */
        case 'string':
          return 'r += "' + PluralFormat.Utils.numSub(
            PluralFormat.Utils.escapeExpression( ast.val ),
            'k_' + data.pf_count + ' - off_' + ( data.pf_count - 1 )
          ) + '";\n';
        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast );
  };

  PluralFormat.prototype.compile = function ( message ) {
    return (new Function( 'PluralFormat',
      'return ' +
        this.precompile(
          this.parse( message )
        )
    ))(PluralFormat);
  };


  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = PluralFormat;
    }
    exports.PluralFormat = PluralFormat;
  }
  else {
    root['PluralFormat'] = PluralFormat;
  }

})( this );
