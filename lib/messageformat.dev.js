/**
 * messageformat.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 * 
 * Copyright 2014
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.1.7
 * @contributor_license Dojo CLA
 */

(function ( root ) {

  function MessageFormat ( locale, pluralFunc ) {
    var lc = locale || 'en', lcFn;
    if ( pluralFunc ) {
      MessageFormat.locale[lc] = pluralFunc;
    } else {
      while ( lc && ! MessageFormat.locale.hasOwnProperty( lc ) ) {
        lc = lc.replace(/[-_]?[^-_]*$/, '');
      }
      if ( ! lc ) {
        lc = locale.replace(/[-_].*$/, '');
        lcFn = (typeof require != 'undefined') && require('make-plural').build(lc);
        if (lcFn) MessageFormat.locale[lc] = lcFn;
        else throw 'Locale `' + lc + '` could not be loaded';
      }
    }
    this.lc = lc;  // used in 'elementFormat'
  }

  if ( !('locale' in MessageFormat) ) MessageFormat.locale = {};

  var runtimeFunctions = {
    c: function(d,k){if(!d)throw new Error("MessageFormat: Data required for \'"+k+"\'.")},
    n: function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: \'"+k+"\' isn\'t a number.");return d[k]-(o||0)},
    v: function(f,d,k){f.c(d,k);return d[k]},
    p: function(f,g,d,k,o,p){f.c(d,k);return d[k] in p?p[d[k]]:(k=g(d[k]-o),k in p?p[k]:p.other)},
    s: function(f,d,k,p){f.c(d,k);return d[k] in p?p[d[k]]:p.other}
  };

  MessageFormat.prototype.renderRuntime = function () {
    var l = [];
    for ( var lc in MessageFormat.locale ) {
      if ( MessageFormat.locale.hasOwnProperty(lc) ) {
        l.push(JSON.stringify(lc) + ':' + MessageFormat.locale[lc].toString().trim());
      }
    }
    return 'var f = {\n'
      + '  c:' + runtimeFunctions.c.toString() + ',\n'
      + '  n:' + runtimeFunctions.n.toString() + ',\n'
      + '  v:' + runtimeFunctions.v.toString() + ',\n'
      + '  p:' + runtimeFunctions.p.toString() + ',\n'
      + '  s:' + runtimeFunctions.s.toString() + '';
      + '};\n';
      + 'var g = {' + l.join(',') + '};\n';
  };

  var mparser = require( './message_parser' );

  MessageFormat.prototype.parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  MessageFormat.prototype.precompile = function ( ast ) {
    var self = this,
        needOther = false;

    function _next ( data ) {
      var res = JSON.parse( JSON.stringify( data ) );
      res.pf_count++;
      return res;
    }
    function interpMFP ( ast, data ) {
      // Set some default data
      data = data || { keys: {}, offset: {} };
      var r = [], i, tmp;

      switch ( ast.type ) {
        case 'program':
          return interpMFP( ast.program );
        case 'messageFormatPattern':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          tmp = r.join('+') || '""';
          return data.pf_count ? tmp : 'function(d){return ' + tmp + '}';
        case 'messageFormatPatternRight':
          for ( i = 0; i < ast.statements.length; ++i ) {
            r.push(interpMFP( ast.statements[i], data ));
          }
          return r.join('+');
        case 'messageFormatElement':
          data.pf_count = data.pf_count || 0;
          if ( ast.output ) {
            return 'f.v(f,d,"' + ast.argumentIndex + '")';
          }
          else {
            data.keys[data.pf_count] = '"' + ast.argumentIndex + '"';
            return interpMFP( ast.elementFormat, data );
          }
          return '';
        case 'elementFormat':
          if ( ast.key === 'select' ) {
            return 'f.s(f,d,' + data.keys[data.pf_count] + ',' + interpMFP( ast.val, data ) + ')';
          }
          else if ( ast.key === 'plural' ) {
            data.offset[data.pf_count || 0] = ast.val.offset || 0;
            return 'f.p(f,g,d,' + data.keys[data.pf_count] + ',' + (data.offset[data.pf_count] || 0)
              + ',' + interpMFP( ast.val, data ) + ')';
          }
          return '';
        /* // Unreachable cases.
        case 'pluralStyle':
        case 'selectStyle':*/
        case 'pluralFormatPattern':
          data.pf_count = data.pf_count || 0;
          needOther = true;
          // We're going to simultaneously check to make sure we hit the required 'other' option.

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in pluralFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        case 'selectFormatPattern':

          data.pf_count = data.pf_count || 0;
          data.offset[data.pf_count] = 0;
          needOther = true;

          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in selectFormatPattern " + data.pf_count);
          }
          return '{' + r.join(',') + '}';
        /* // Unreachable
        case 'pluralForms':
        */
        case 'string':
          tmp = '"' + (ast.val || "").replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
          if ( data.pf_count ) {
            var o = data.offset[data.pf_count-1];
            tmp = tmp.replace(/(^|[^\\])#/g, '$1"+' + 'f.n(d,' + data.keys[data.pf_count-1] + (o ? ',' + o : '') + ')+"');
            tmp = tmp.replace(/^""\+/, '').replace(/\+""$/, '');
          }
          return tmp;
        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast );
  };

  MessageFormat.prototype.compile = function ( message ) {
    return ("f", "g", new Function(
      'return ' + this.precompile( this.parse( message ))
    ))(runtimeFunctions, MessageFormat.locale[this.lc]);
  };

  MessageFormat.prototype.precompileObject = function ( messages ) {
    var tmp = [];
    for (var key in messages) {
      tmp.push(JSON.stringify(key) + ':' + this.precompile(this.parse(messages[key])));
    }
    return '{\n' + tmp.join(',\n') + '}';
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
