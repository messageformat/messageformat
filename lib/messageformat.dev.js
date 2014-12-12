/**
 * messageformat.js
 *
 * ICU PluralFormat + SelectFormat for JavaScript
 * 
 * Copyright 2014
 * 
 * Licensed under the MIT License
 *
 * @author Alex Sexton - @SlexAxton
 * @version 0.2.1
 * @contributor_license Dojo CLA
 */

(function ( root ) {

  function MessageFormat(locale, pluralFunc, formatters) {
    if (!locale) {
      this.lc = ['en'];
    } else if (typeof locale == 'string') {
      this.lc = [];
      for (var l = locale; l; l = l.replace(/[-_]?[^-_]*$/, '')) this.lc.push(l);
    } else {
      this.lc = locale;
    }
    if (!pluralFunc) {
      pluralFunc = MessageFormat.getPluralFunc(this.lc);
      if (!pluralFunc) throw 'Plural function for locale `' + this.lc.join(',') + '` could not be loaded';
    }
    this.runtime.pf = {};
    this.runtime.pf[this.lc[0]] = pluralFunc;
    this.runtime.fmt = {};
    if (formatters) for (var f in formatters) {
      this.runtime.fmt[f] = formatters[f];
    }
  }

  if (!('plurals' in MessageFormat)) MessageFormat.plurals = {};

  MessageFormat.getPluralFunc = function(locale) {
    var MakePlural = (typeof require != 'undefined') && require('make-plural') || root.MakePlural || function() { return false; };
    for (var i = 0; i < locale.length; ++i) {
      var lc = locale[i];
      if (lc in MessageFormat.plurals) {
        return MessageFormat.plurals[lc];
      }
      var fn = MakePlural(lc, {ordinals:1, quiet:1});
      if (fn) {
        MessageFormat.plurals[lc] = fn;
        return fn;
      }
    }
    return null;
  }

  // note: Intl is not defined in default Node until joyent/node#7676 lands
  MessageFormat.formatters = {
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

  MessageFormat.prototype.setIntlSupport = function(enable) {
	  this.withIntlSupport = !!enable || (typeof enable == 'undefined');
	  return this;
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

  MessageFormat._parse = function () {
    // Bind to itself so error handling works
    return mparser.parse.apply( mparser, arguments );
  };

  var propname = function(s) {
    return /^[A-Z_$][0-9A-Z_$]*$/i.test(s) ? s : JSON.stringify(s);
  };

  MessageFormat.prototype._precompile = function(ast, data) {
    data = data || { keys: {}, offset: {} };
    var r = [], i, tmp, args = [];

    switch ( ast.type ) {
      case 'messageFormatPattern':
        for ( i = 0; i < ast.statements.length; ++i ) {
          r.push(this._precompile( ast.statements[i], data ));
        }
        tmp = r.join('+') || '""';
        return data.pf_count ? tmp : 'function(d){return ' + tmp + '}';

      case 'messageFormatPatternRight':
        for ( i = 0; i < ast.statements.length; ++i ) {
          r.push(this._precompile( ast.statements[i], data ));
        }
        return r.join('+');

      case 'messageFormatElement':
        data.pf_count = data.pf_count || 0;
        if ( ast.output ) {
          return 'd[' + JSON.stringify(ast.argumentIndex) + ']';
        }
        else {
          data.keys[data.pf_count] = JSON.stringify(ast.argumentIndex);
          return this._precompile( ast.elementFormat, data );
        }
        return '';

      case 'elementFormat':
        var args = [ 'd[' + data.keys[data.pf_count] + ']' ];
        switch (ast.key) {
          case 'select':
            args.push(this._precompile(ast.val, data));
            return '_s(' + args.join(',') + ')';
          case 'selectordinal':
            args = args.concat([ 0, 'pf[' + JSON.stringify(this.lc[0]) + ']', this._precompile(ast.val, data), 1 ]);
            return '_p(' + args.join(',') + ')';
          case 'plural':
            data.offset[data.pf_count || 0] = ast.val.offset || 0;
            args = args.concat([ data.offset[data.pf_count] || 0, 'pf[' + JSON.stringify(this.lc[0]) + ']', this._precompile(ast.val, data) ]);
            return '_p(' + args.join(',') + ')';
          default:
            if (this.withIntlSupport && !(ast.key in this.runtime.fmt) && (ast.key in MessageFormat.formatters)) {
              tmp = MessageFormat.formatters[ast.key];
              this.runtime.fmt[ast.key] = (typeof tmp(this) == 'function') ? tmp(this) : tmp;
            }
            args.push(JSON.stringify(this.lc));
            if (ast.val && ast.val.length) args.push(JSON.stringify(ast.val.length == 1 ? ast.val[0] : ast.val));
            return 'fmt.' + ast.key + '(' + args.join(',') + ')';
        }

      case 'pluralFormatPattern':
      case 'selectFormatPattern':
        data.pf_count = data.pf_count || 0;
        if (ast.type == 'selectFormatPattern') data.offset[data.pf_count] = 0;
        var needOther = true;
        for ( i = 0; i < ast.pluralForms.length; ++i ) {
          var key = ast.pluralForms[i].key;
          if ( key === 'other' ) {
            needOther = false;
          }
          var data_copy = JSON.parse(JSON.stringify(data));
          data_copy.pf_count++;
          r.push(propname(key) + ':' + this._precompile(ast.pluralForms[i].val, data_copy));
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
  };

  MessageFormat.prototype.compile = function ( messages, opt ) {
    var r = {}, lc0 = this.lc,
        compileMsg = function(self, msg) {
          try {
            var ast = MessageFormat._parse(msg).program;
            return self._precompile(ast);
          } catch (e) {
            throw new Error((ast ? 'Precompiler' : 'Parser') + ' error: ' + e.toString());
          }
        },
        stringify = function(r) {
          if (typeof r != 'object') return r;
          var o = [];
          for (var k in r) o.push(propname(k) + ':' + stringify(r[k]));
          return '{\n' + o.join(',\n') + '}';
        };

    if (typeof messages == 'string') {
      var f = new Function('_n,_p,_s,pf,fmt', 'return ' + compileMsg(this, messages));
      return f(this.runtime._n, this.runtime._p, this.runtime._s, this.runtime.pf, this.runtime.fmt);
    }

    opt = opt || {};

    for (var ns in messages) {
      if (opt.locale) this.lc = opt.locale[ns] && [].concat(opt.locale[ns]) || lc0;
      if (typeof messages[ns] == 'string') {
        try { r[ns] = compileMsg(this, messages[ns]); }
        catch (e) { e.message = e.message.replace(':', ' with `' + ns + '`:'); throw e; }
      } else {
        r[ns] = {};
        for (var key in messages[ns]) {
          try { r[ns][key] = compileMsg(this, messages[ns][key]); }
          catch (e) { e.message = e.message.replace(':', ' with `' + key + '` in `' + ns + '`:'); throw e; }
        }
      }
    }

    this.lc = lc0;
    var s = 'var\n' + this.runtime.toString() + ';\n\n';
    switch (opt.global || '') {
      case 'exports':
        var o = [];
        for (var k in r) o.push('exports[' + JSON.stringify(k) + '] = ' + stringify(r[k]));
        return new Function(s + o.join(';\n'));
      case 'module.exports':
        return new Function(s + 'module.exports = ' + stringify(r));
      case '':
        return new Function(s + 'return ' + stringify(r));
      default:
        return new Function('G', s + 'G[' + JSON.stringify(opt.global) + '] = ' + stringify(r));
    }
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
