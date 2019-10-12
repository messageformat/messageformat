const { oneLine } = require('common-tags');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const yargs = require('yargs');

module.exports = function getOptions() {
  let cfg = {};
  for (const fn of [
    'messageformat.rc.js',
    'messageformat.rc.json',
    'messageformat.rc.yaml',
    'messageformat.rc.yml'
  ]) {
    try {
      const cfgPath = path.resolve(fn);
      if (fn.endsWith('.js')) {
        cfg = require(cfgPath);
      } else {
        const src = fs.readFileSync(cfgPath, 'utf8');
        cfg = YAML.parse(src);
      }
      break;
    } catch (e) {
      /* ignore errors */
    }
  }
  const usage = [
    '$0 [input, ...] [options]',
    oneLine`
      Parses input JSON, YAML, and .properties files of MessageFormat strings
      into an ES module of corresponding hierarchical functions. Input
      directories are recursively scanned for all files matching the supported
      extensions.
    `,
    oneLine`
      Configuration may also be set under the package.json "messageformat" key or
      messageformat.rc.{js,json,yaml}.
    `
  ].join('\n\n');

  return yargs
    .scriptName('messageformat')
    .pkgConf('messageformat')
    .config(cfg)
    .options({
      delimiters: {
        alias: 'd',
        array: true,
        default: ['._' + path.sep]
      },
      'eslint-disable': {
        boolean: true,
        hidden: true
      },
      extensions: {
        alias: 'e',
        array: true,
        default: ['.json', '.properties', '.yaml', '.yml']
      },
      locale: {
        alias: 'l',
        array: true,
        default: ['*'],
        desc: oneLine`
          The locale(s) to include; if multiple, selected by matching message key.
          If not set, path keys matching any locale code will set the active
          locale, starting with a default 'en' locale.
        `
      },
      options: {
        desc: oneLine`
          Options to pass to the MessageFormat constructor via its second argument.
          Use dot-notation to set values, e.g. --options.currency=EUR. For custom
          formatters, you'll need to set their values in a JS config file.
        `
      },
      outfile: {
        alias: 'o',
        default: '-',
        desc:
          'Write output to the specified file. If undefined or "-", prints to stdout.',
        string: true
      },
      simplify: {
        alias: 's',
        boolean: true
      }
    })
    .coerce({
      delimiters(delim) {
        const str = delim
          .join('')
          .replace(/[/\\]+/g, '\\' + path.sep)
          .replace(/[-\]]/g, '\\$&');
        return new RegExp(`[${str}]`);
      },
      extensions(ext) {
        return ext.map(x => x.trim().replace(/^([^.]*\.)?/, '.'));
      },
      locale(locales) {
        return locales.reduce(
          (locales, lc) => locales.concat(lc.split(/[ ,]+/)),
          []
        );
      },
      _(input) {
        if (input.length === 0)
          throw new Error('At least one input file or directory is required.');
        return input.map(fn => path.resolve(fn));
      }
    })
    .usage(usage)
    .help()
    .version()
    .parse();
};
