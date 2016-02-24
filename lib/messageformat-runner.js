var
  fs            = require('fs'),
  Path          = require('path'),
  glob          = require('glob'),
  async         = require('async'),
  MessageFormat = require('../'),
  defaults = {
    "inputdir"  : process.cwd(),
    "output"    : process.cwd(),
    "watch"     : false,
    "namespace" : 'i18n',
    "include"   : '**/*.json',
    "stdout"    : false,
    "verbose"   : false,
    "module"    : false,
    "help"      : false
  },
  _log          = function(){};

function write(options, data) {
  if (options.stdout) { _log(''); return console.log(data); }
  fs.writeFile( options.output, data, 'utf8', function(err) {
    if (err) return console.error('--->\t' + err.message);
    _log(options.output + " written.");
  });
}

function parseFileSync(dir, file) {
  var path = Path.join(dir, file),
      file_parts = file.split(/[.\/]+/),
      r = { namespace: null, locale: null, data: null };
  if (!fs.statSync(path).isFile()) {
    _log('Skipping ' + file);
    return null;
  }
  r.namespace = file.replace(/\.[^.]*$/, '').replace(/\\/g, '/');
  for (var i = file_parts.length - 1; i >= 0; --i) {
    if (file_parts[i] in MessageFormat.plurals) { r.locale = file_parts[i]; break; }
  }
  try {
    _log('Building ' + JSON.stringify(r.namespace) + ' from `' + file + '` with ' + (r.locale ? 'locale ' + JSON.stringify(r.locale) : 'default locale'));
    r.data = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (ex) {
    console.error('--->\tRead error in ' + path + ': ' + ex.message);
  }
  return r;
}

function build(options, callback) {
  for (var key in defaults) {
    options[key] = options[key] || defaults[key];
  }
  options.verbose && (_log = function(s) { console.log(s); });
  if (fs.existsSync(options.output) && fs.statSync(options.output).isDirectory()) {
    options.output = Path.join(options.output, 'i18n.js');
  }
  options.namespace = options.module ? 'module.exports' : options.namespace.replace(/^window\./, '');
  var lc = options.locale.trim().split(/[ ,]+/),
      mf = new MessageFormat(lc[0]),
      messages = {},
      compileOpt = { global: options.namespace, locale: {} };
  lc.slice(1).forEach(function(l){
    var pf = mf.runtime.pluralFuncs[l] = MessageFormat.plurals[l];
    if (!pf) throw 'Plural function for locale `' + l + '` not found';
  });
  _log('Input dir: ' + options.inputdir);
  _log('Included locales: ' + lc.join(', '));
  glob(options.include, {cwd: options.inputdir}, function(err, files) {
    if (!err) async.each(files,
      function(file, cb) {
        var r = parseFileSync(options.inputdir, file);
        if (r && r.data) {
          messages[r.namespace] = r.data;
          if (r.locale) compileOpt.locale[r.namespace] = r.locale;
        }
        cb();
      },
      function() {
        var fn_str = mf.compile(messages, compileOpt).toString();
        fn_str = fn_str.replace(/^\s*function\b[^{]*{\s*/, '').replace(/\s*}\s*$/, '');
        var data = options.module ? fn_str : '(function(G) {\n' + fn_str + '\n})(this);';
        return callback(options, data.trim() + '\n');
      }
    );
  });
}

function runner(options) {
  build(options, write);
}

module.exports = runner;
