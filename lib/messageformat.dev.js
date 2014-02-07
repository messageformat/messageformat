/**
 * messageformat.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.1.7
 * @license WTFPL
 * @contributor_license Dojo CLA
*/
(function ( root ) {

  // Create the contructor function
  function MessageFormat ( locale, pluralFunc ) {
    var fallbackLocale;

    if ( locale && pluralFunc ) {
      MessageFormat.locale[ locale ] = pluralFunc;
    }

    // Defaults
    fallbackLocale = locale = locale || "en";
    pluralFunc = pluralFunc || MessageFormat.locale[ fallbackLocale = MessageFormat.Utils.getFallbackLocale( locale ) ];

    if ( ! pluralFunc ) {
      throw new Error( "Plural Function not found for locale: " + locale );
    }

    // Own Properties
    this.pluralFunc = pluralFunc;
    this.locale = locale;
    this.fallbackLocale = fallbackLocale;
  }

  // methods in common with the generated MessageFormat
  MessageFormat.check_d = function(d){
    if(!d){throw new Error("MessageFormat: No data passed to function.")}
  };
  MessageFormat.num = function(d, key, off){
    if(isNaN(d[key])){throw new Error("MessageFormat: `"+key+"` isnt a number.")}
    return d[key] - (off || 0);
  };
  MessageFormat.plural = function(p, k, o, d, l){
    return (p[ d[k] + "" ] || p[ MessageFormat.locale[l](d[k] - o) ] || p["other"])(d);
  };
  MessageFormat.select = function(d, k, p){
    return (p[ d[k] ] || p["other"])(d);
  }

  // Set up the locales object. Add in english by default
  MessageFormat.locale = {
    "en" : function ( n ) {
      if ( n === 1 ) {
        return "one";
      }
      return "other";
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
    numSub : function ( string, d, key, offset ) {
      // make sure that it's not an escaped octothorpe
      return string.replace( /^#|[^\\]#/g, function (m) {
        var prefix = m && m.length === 2 ? m.charAt(0) : '';
        return prefix + '" + MessageFormat.num(' + d + ',' + key + (offset ? ',' + offset : '') + ') + "';
      });
    },
    escapeExpression : function (string) {
      var escape = {
            "\n": "\\n",
            "\"": '\\"'
          },
          badChars = /[\n"]/g,
          possible = /[\n"]/,
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
    },
    getFallbackLocale: function( locale ) {
      var tagSeparator = locale.indexOf("-") >= 0 ? "-" : "_";

      // Lets just be friends, fallback through the language tags
      while ( ! MessageFormat.locale.hasOwnProperty( locale ) ) {
        locale = locale.substring(0, locale.lastIndexOf( tagSeparator ));
        if (locale.length === 0) {
          return null;
        }
      }

      return locale;
    }
  };

  var mparser = require( './message_parser' );

  MessageFormat.prototype.parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  MessageFormat.prototype.precompile = function ( ast ) {
    var self = this,
        needOther = false;

    function interpMFP ( ast, data ) {
      // Set some default data
      data = data || { keys: {}, offset: {} };
      var s = '', i, tmp;

      switch ( ast.type ) {
        case 'program':
          return interpMFP( ast.program );
        case 'messageFormatPattern':
          for ( i = 0; i < ast.statements.length; ++i ) {
            s += interpMFP( ast.statements[i], data );
          }
          if ( /^r \+=/.test(s) ) {
            tmp = /^(r \+= (.+)\n)?$/.exec(s);
            if ( tmp ) {
              s = 'return ' + (tmp[2] || '"";');
            } else {
              s = s.replace(/^r \+=/, 'var r =') + 'return r;\n';
            }
          } else {
            s = s ? 'var r = "";\n' + s + 'return r;\n' : 'return "";';
          }
          if ( data.check_d && !data.pf_count ) {
            s = 'MessageFormat.check_d(d);\n' + s;
            data.check_d = false;
          }
          return 'function(d){' + (s.indexOf('\n') !== -1 ? '\n' : '') + s + '}';
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
            data.keys[data.pf_count] = '"' + ast.argumentIndex + '"';
            s += interpMFP( ast.elementFormat, data );
          }
          data.check_d = true;
          return s;
        case 'elementFormat':
          if ( ast.key === 'select' ) {
            s += interpMFP( ast.val, data );
            s += 'r += MessageFormat.select(d,' + data.keys[data.pf_count] + ',pf_' + data.pf_count + ');\n';
          }
          else if ( ast.key === 'plural' ) {
            s += interpMFP( ast.val, data );
            s += 'r += MessageFormat.plural(pf_' + data.pf_count + ',' + data.keys[data.pf_count] + ',' + data.offset[data.pf_count] + ',d,"' + self.fallbackLocale + '");\n';
          }
          return s;
        /* // Unreachable cases.
        case 'pluralStyle':
        case 'selectStyle':*/
        case 'pluralFormatPattern':
          data.pf_count = data.pf_count || 0;
          data.offset[data.pf_count] = ast.offset || 0;
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
          data.offset[data.pf_count] = 0;
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
          tmp = MessageFormat.Utils.escapeExpression( ast.val );
          if ( data.pf_count ) {
            tmp = MessageFormat.Utils.numSub( tmp, 'd', data.keys[data.pf_count-1], data.offset[data.pf_count-1]);
          }
          return 'r += "' + tmp + '";\n';
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
  else if (typeof define === 'function' && define.amd) {
    define(function() {
      return MessageFormat;
    });
  }
  else {
    root['MessageFormat'] = MessageFormat;
  }

})( this );
