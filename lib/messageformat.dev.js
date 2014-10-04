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
      if (!pluralFunc) throw 'Plural function for locale `' + this.lc.join(',') + '` could not be loaded';
    }
    this.runtime.fmt = {};
    this.runtime.pf = {};
    this.runtime.pf[this.lc[0]] = pluralFunc;
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

  // note: Intl is not defined in default Node until joyent/node#7676 lands
  MessageFormat.format = {
    number: function(self) {
      return new Function("v,lc,p",
        "return Intl.NumberFormat(lc,\n" +
        "    p=='integer' ? {maximumFractionDigits:0}\n" +
        "  : p=='percent' ? {style:'percent'}\n" +
        "  : p=='currency' ? {style:'currency', currency:'" + (self.currency || 'USD') + "', minimumFractionDigits:2, maximumFractionDigits:2}\n" +
        "  : {}).format(v)"
      );
    },
    date: function(v,lc,p) {
      var o = {day:'numeric', month:'short', year:'numeric'};
      switch (p) {
        case 'full': o.weekday = 'long';
        case 'long': o.month = 'long'; break;
        case 'short': o.month = 'numeric';
      }
      return (new Date(v)).toLocaleDateString(lc, o)
    },
    time: function(v,lc,p) {
      var o = {second:'numeric', minute:'numeric', hour:'numeric'};
      switch (p) {
        case 'full': case 'long': o.timeZoneName = 'short'; break;
        case 'short': delete o.minute;
      }
      return (new Date(v)).toLocaleTimeString(lc, o)
    }
  };

  MessageFormat.prototype.runtime = {
    _n: function(v,o){if(isNaN(v))throw new Error("'"+v+"' isn't a number.");return v-(o||0)},
    _p: function(v,o,l,p,s){return v in p?p[v]:(v=l(v-o,s),v in p?p[v]:p.other)},
    _s: function(v,p){return v in p?p[v]:p.other},
    pf: {},
    fmt: {},
    toString: function () {
      var _stringify = function(o, top) {
        if (typeof o != 'object') return o.toString().replace(/^(function) \w*/, '$1');
        var s = [];
        for (var i in o) if (i != 'toString') {
          s.push((top ? i + '=' : JSON.stringify(i) + ':') + _stringify(o[i], false));
        }
        return top ? s.join(',\n') : '{' + s.join(',\n') + '}';
      };
      return _stringify(this, true);
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
      data = data || { keys: {}, offset: {} };
      var r = [], i, tmp, args = [];

      switch ( ast.type ) {
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
          var args = [ 'd[' + data.keys[data.pf_count] + ']' ];
          switch (ast.key) {
            case 'select':
              args.push(interpMFP(ast.val, data));
              return '_s(' + args.join(',') + ')';
            case 'selectordinal':
              args = args.concat([ 0, 'pf[' + JSON.stringify(self.lc[0]) + ']', interpMFP(ast.val, data), 1 ]);
              return '_p(' + args.join(',') + ')';
            case 'plural':
              data.offset[data.pf_count || 0] = ast.val.offset || 0;
              args = args.concat([ data.offset[data.pf_count] || 0, 'pf[' + JSON.stringify(self.lc[0]) + ']', interpMFP(ast.val, data) ]);
              return '_p(' + args.join(',') + ')';
            default:
              if (!(ast.key in self.runtime.fmt) && (ast.key in MessageFormat.format)) {
                tmp = MessageFormat.format[ast.key];
                self.runtime.fmt[ast.key] = (typeof tmp(self) == 'function') ? tmp(self) : tmp;
              }
              args.push(JSON.stringify(self.lc));
              if (ast.val && ast.val.length) args.push(JSON.stringify(ast.val.length == 1 ? ast.val[0] : ast.val));
              return 'fmt.' + ast.key + '(' + args.join(',') + ')';
          }

        case 'pluralFormatPattern':
        case 'selectFormatPattern':
          data.pf_count = data.pf_count || 0;
          if (ast.type == 'selectFormatPattern') data.offset[data.pf_count] = 0;
          needOther = true;
          for ( i = 0; i < ast.pluralForms.length; ++i ) {
            if ( ast.pluralForms[ i ].key === 'other' ) {
              needOther = false;
            }
            r.push('"' + ast.pluralForms[ i ].key + '":' + interpMFP( ast.pluralForms[ i ].val, _next(data) ));
          }
          if ( needOther ) {
            throw new Error("No 'other' form found in " + ast.type + " " + data.pf_count);
          }
          return '{' + r.join(',') + '}';

        case 'string':
          tmp = '"' + (ast.val || "").replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
          if ( data.pf_count ) {
            args = [ 'd[' + data.keys[data.pf_count-1] + ']' ];
            if (data.offset[data.pf_count-1]) args.push(data.offset[data.pf_count-1]);
            tmp = tmp.replace(/(^|[^\\])#/g, '$1"+' + '_n(' + args.join(',') + ')+"');
            tmp = tmp.replace(/^""\+/, '').replace(/\+""$/, '');
          }
          return tmp;

        default:
          throw new Error( 'Bad AST type: ' + ast.type );
      }
    }
    return interpMFP( ast.program );
  };

  MessageFormat.prototype.compile = function ( message ) {
    return (new Function('_n,_p,_s,pf,fmt',
      'return ' + this.precompile( this.parse( message ))
    ))(this.runtime._n, this.runtime._p, this.runtime._s, this.runtime.pf, this.runtime.fmt);
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
