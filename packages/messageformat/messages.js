/**
 * @classdesc Accessor for compiled MessageFormat functions
 *
 * ```
 * import Messages from 'messageformat/messages'
 * ```
 *
 * @class
 * @param {object} locales A map of locale codes to their function objects
 * @param {string|null} [defaultLocale] If not defined, default and initial locale is the first entry of `locales`
 *
 * @example
 * var fs = require('fs');
 * var MessageFormat = require('messageformat');
 * var mf = new MessageFormat(['en', 'fi']);
 * var msgSet = {
 *   en: {
 *     a: 'A {TYPE} example.',
 *     b: 'This has {COUNT, plural, one{one user} other{# users}}.',
 *     c: {
 *       d: 'We have {P, number, percent} code coverage.'
 *     }
 *   },
 *   fi: {
 *     b: 'Tällä on {COUNT, plural, one{yksi käyttäjä} other{# käyttäjää}}.',
 *     e: 'Minä puhun vain suomea.'
 *   }
 * };
 * var cfStr = mf.compile(msgSet).toString('module.exports');
 * fs.writeFileSync('messages.js', cfStr);
 *
 * ...
 *
 * var Messages = require('messageformat/messages');
 * var msgData = require('./messages');
 * var messages = new Messages(msgData, 'en');
 *
 * messages.hasMessage('a')                // true
 * messages.hasObject('c')                 // true
 * messages.get('b', { COUNT: 3 })         // 'This has 3 users.'
 * messages.get(['c', 'd'], { P: 0.314 })  // 'We have 31% code coverage.'
 *
 * messages.get('e')                       // 'e'
 * messages.setFallback('en', ['foo', 'fi'])
 * messages.get('e')                       // 'Minä puhun vain suomea.'
 *
 * messages.locale = 'fi'
 * messages.hasMessage('a')                // false
 * messages.hasMessage('a', 'en')          // true
 * messages.hasMessage('a', null, true)    // true
 * messages.hasObject('c')                 // false
 * messages.get('b', { COUNT: 3 })         // 'Tällä on 3 käyttäjää.'
 * messages.get('c').d({ P: 0.628 })       // 'We have 63% code coverage.'
 */
function Messages(locales, defaultLocale) {
  this._data = {};
  this._fallback = {};
  Object.keys(locales).forEach(function(lc) {
    if (lc !== 'toString') {
      this._data[lc] = locales[lc];
      if (typeof defaultLocale === 'undefined') defaultLocale = lc;
    }
  }, this);

  /**
   * List of available locales
   * @readonly
   * @memberof Messages
   * @member {string[]} availableLocales
   */
  Object.defineProperty(this, 'availableLocales', {
    get: function() {
      return Object.keys(this._data);
    }
  });

  /**
   * Current locale
   *
   * One of Messages#availableLocales or `null`. Partial matches of language tags
   * are supported, so e.g. with an `en` locale defined, it will be selected by
   * `messages.locale = 'en-US'` and vice versa.
   *
   * @memberof Messages
   * @member {string|null} locale
   */
  Object.defineProperty(this, 'locale', {
    get: function() {
      return this._locale;
    },
    set: function(lc) {
      this._locale = this.resolveLocale(lc);
    }
  });
  this.locale = defaultLocale;

  /**
   * Default fallback locale
   *
   * One of Messages#availableLocales or `null`. Partial matches of language tags
   * are supported, so e.g. with an `en` locale defined, it will be selected by
   * `messages.defaultLocale = 'en-US'` and vice versa.
   *
   * @memberof Messages
   * @member {string|null} defaultLocale
   */
  Object.defineProperty(this, 'defaultLocale', {
    get: function() {
      return this._defaultLocale;
    },
    set: function(lc) {
      this._defaultLocale = this.resolveLocale(lc);
    }
  });
  this._defaultLocale = this._locale;
}

module.exports = Messages;

/**
 * Add new messages to the accessor; useful if loading data dynamically
 *
 * The locale code `lc` should be an exact match for the locale being updated,
 * or empty to default to the current locale. Use {@link #resolveLocale} for
 * resolving partial locale strings.
 *
 * If `keypath` is empty, adds or sets the complete message object for the
 * corresponding locale. If any keys in `keypath` do not exist, a new object
 * will be created at that key.
 *
 * @param {function|object} data Hierarchical map of keys to functions, or a
 *   single message function
 * @param {string} [lc] If empty or undefined, defaults to `this.locale`
 * @param {string[]} [keypath] The keypath being added
 * @returns {Messages} The Messages instance, to allow for chaining
 */
Messages.prototype.addMessages = function(data, lc, keypath) {
  if (!lc) lc = this.locale;
  if (typeof data !== 'function') {
    data = Object.keys(data).reduce(function(map, key) {
      if (key !== 'toString') map[key] = data[key];
      return map;
    }, {});
  }
  if (Array.isArray(keypath) && keypath.length > 0) {
    var parent = this._data[lc];
    for (var i = 0; i < keypath.length - 1; ++i) {
      var key = keypath[i];
      if (!parent[key]) parent[key] = {};
      parent = parent[key];
    }
    parent[keypath[keypath.length - 1]] = data;
  } else {
    this._data[lc] = data;
  }
  return this;
};

/**
 * Resolve `lc` to the key of an available locale or `null`, allowing for
 * partial matches. For example, with an `en` locale defined, it will be
 * selected by `messages.defaultLocale = 'en-US'` and vice versa.
 *
 * @param {string} lc Locale code
 * @returns {string|null}
 */
Messages.prototype.resolveLocale = function(lc) {
  if (this._data[lc]) return lc;
  if (lc) {
    var l = String(lc);
    while ((l = l.replace(/[-_]?[^-_]*$/, ''))) {
      if (this._data[l]) return l;
    }
    var ll = this.availableLocales;
    var re = new RegExp('^' + lc + '[-_]');
    for (var i = 0; i < ll.length; ++i) {
      if (re.test(ll[i])) return ll[i];
    }
  }
  return null;
};

/**
 * Get the list of fallback locales
 * @param {string} [lc] If empty or undefined, defaults to `this.locale`
 * @returns {string[]}
 */
Messages.prototype.getFallback = function(lc) {
  if (!lc) lc = this.locale;
  return (
    this._fallback[lc] ||
    (lc === this.defaultLocale || !this.defaultLocale
      ? []
      : [this.defaultLocale])
  );
};

/**
 * Set the fallback locale or locales for `lc`
 *
 * To disable fallback for the locale, use `setFallback(lc, [])`.
 * To use the default fallback, use `setFallback(lc, null)`.
 *
 * @param {string} lc
 * @param {string[]|null} fallback
 * @returns {Messages} The Messages instance, to allow for chaining
 */
Messages.prototype.setFallback = function(lc, fallback) {
  this._fallback[lc] = Array.isArray(fallback) ? fallback : null;
  return this;
};

/**
 * Check if `key` is a message function for the locale
 *
 * `key` may be a `string` for functions at the root level, or `string[]` for
 * accessing hierarchical objects. If an exact match is not found and `fallback`
 * is true, the fallback locales are checked for the first match.
 *
 * @param {string|string[]} key The key or keypath being sought
 * @param {string} [lc] If empty or undefined, defaults to `this.locale`
 * @param {boolean} [fallback=false] If true, also checks fallback locales
 * @returns {boolean}
 */
Messages.prototype.hasMessage = function(key, lc, fallback) {
  if (!lc) lc = this.locale;
  var fb = fallback ? this.getFallback(lc) : null;
  return _has(this._data, lc, key, fb, 'function');
};

/**
 * Check if `key` is a message object for the locale
 *
 * `key` may be a `string` for functions at the root level, or `string[]` for
 * accessing hierarchical objects. If an exact match is not found and `fallback`
 * is true, the fallback locales are checked for the first match.
 *
 * @param {string|string[]} key The key or keypath being sought
 * @param {string} [lc] If empty or undefined, defaults to `this.locale`
 * @param {boolean} [fallback=false] If true, also checks fallback locales
 * @returns {boolean}
 */
Messages.prototype.hasObject = function(key, lc, fallback) {
  if (!lc) lc = this.locale;
  var fb = fallback ? this.getFallback(lc) : null;
  return _has(this._data, lc, key, fb, 'object');
};

/**
 * Get the message or object corresponding to `key`
 *
 * `key` may be a `string` for functions at the root level, or `string[]` for
 * accessing hierarchical objects. If an exact match is not found, the fallback
 * locales are checked for the first match.
 *
 * If `key` maps to a message function, it will be called with `props`. If it
 * maps to an object, the object is returned directly.
 *
 * @param {string|string[]} key The key or keypath being sought
 * @param {object} [props] Optional properties passed to the function
 * @param {string} [lc] If empty or undefined, defaults to `this.locale`
 * @returns {string|Object<string,function|object>}
 */
Messages.prototype.get = function(key, props, lc) {
  if (!lc) lc = this.locale;
  var msg = _get(this._data[lc], key);
  if (msg) return typeof msg == 'function' ? msg(props) : msg;
  var fb = this.getFallback(lc);
  for (var i = 0; i < fb.length; ++i) {
    msg = _get(this._data[fb[i]], key);
    if (msg) return typeof msg == 'function' ? msg(props) : msg;
  }
  return key;
};

/** @private */
function _get(obj, key) {
  if (!obj) return null;
  if (Array.isArray(key)) {
    for (var i = 0; i < key.length; ++i) {
      obj = obj[key[i]];
      if (!obj) return null;
    }
    return obj;
  }
  return obj[key];
}

/** @private */
function _has(data, lc, key, fallback, type) {
  var msg = _get(data[lc], key);
  if (msg) return typeof msg === type;
  if (fallback) {
    for (var i = 0; i < fallback.length; ++i) {
      msg = _get(data[fallback[i]], key);
      if (msg) return typeof msg === type;
    }
  }
  return false;
}
