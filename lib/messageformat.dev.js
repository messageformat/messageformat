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
    if (!locale) {
      this.lc = ['en'];
    } else if (typeof locale == 'string') {
      this.lc = [];
      for (var l = locale; l; l = l.replace(/[-_]?[^-_]*$/, '')) this.lc.push(l);
    } else {
      this.lc = locale;
    }
    if (!pluralFunc) {
      pluralFunc = MessageFormat.pluralFunc(this.lc);
      if (!pluralFunc) throw 'Locale `' + this.lc.join(',') + '` could not be loaded';
    }
    this.runtime.lc = {};
    this.runtime.lc[this.lc[0]] = pluralFunc;
  }

  if ( !('locale' in MessageFormat) ) MessageFormat.locale = {};

  MessageFormat.pluralFunc = function(locale) {
    var MakePlural = (typeof require != 'undefined') && require('make-plural') || root.MakePlural || function() { return false; };
    for (var i = 0; i < locale.length; ++i) {
      var lc = locale[i];
      if (lc in MessageFormat.locale) {
        return MessageFormat.locale[lc];
      }
      var fn = MakePlural(lc, {ordinals:1, quiet:1});
      if (fn) {
        MessageFormat.locale[lc] = fn;
        return fn;
      }
    }
    return null;
  }

  MessageFormat.prototype.runtime = {
    _n: function(v,o){if(isNaN(v))throw new Error("'"+v+"' isn't a number.");return v-(o||0)},
    _p: function(v,o,l,p,s){return v in p?p[v]:(k=l(v-o,s),k in p?p[k]:p.other)},
    _s: function(v,p){return v in p?p[v]:p.other},
    lc: {},
    toString: function () {
      var _stringify = function(f) {
        if (typeof f != 'object') return f.toString().replace(/^(function) \w*/, '$1');
        var s = [];
        for (var i in f) if (i != 'toString') {
          s.push(JSON.stringify(i) + ':' + _stringify(f[i]));
        }
        return '{' + s.join(',\n') + '}';
      };
      return _stringify(this);
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
            return 'd[' + JSON.stringify(ast.argumentIndex) + ']';
          }
          else {
            data.keys[data.pf_count] = JSON.stringify(ast.argumentIndex);
            return interpMFP( ast.elementFormat, data );
          }
          return '';
        case 'elementFormat':
          if ( ast.key === 'select' ) {
            return 'f._s(d[' + data.keys[data.pf_count] + '],' + interpMFP( ast.val, data ) + ')';
          }
          else if ( ast.key === 'selectordinal' ) {
            return 'f._p(d[' + data.keys[data.pf_count] + '],0,f.lc[' + JSON.stringify(self.lc[0]) + '],' + interpMFP( ast.val, data ) + ',1)';
          }
          else if ( ast.key === 'plural' ) {
            data.offset[data.pf_count || 0] = ast.val.offset || 0;
            return 'f._p(d[' + data.keys[data.pf_count] + '],' + (data.offset[data.pf_count] || 0)
              + ',f.lc[' + JSON.stringify(self.lc[0]) + '],' + interpMFP( ast.val, data ) + ')';
          }
          else {
            return 'f.' + ast.key + '(d[' + data.keys[data.pf_count] + '],' + JSON.stringify(self.lc) + ',' + JSON.stringify(ast.val) + ')';
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
            tmp = tmp.replace(/(^|[^\\])#/g, '$1"+' + 'f._n(d[' + data.keys[data.pf_count-1] + ']' + (o ? ',' + o : '') + ')+"');
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
    return (new Function('f',
      'return ' + this.precompile( this.parse( message ))
    ))(this.runtime);
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
