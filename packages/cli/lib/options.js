const { oneLine } = require('common-tags');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

module.exports = function getOptions() {
  let cfg = {};
  try {
    const cfgPath = path.resolve('messageformat.rc.json');
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (e) {
    /* ignore errors */
  }
  const usage = [
    '$0 [input, ...] [options]',
    oneLine`
      Parses input JSON and .properties files of MessageFormat strings
      into an ES module of corresponding hierarchical functions. Input
      directories are recursively scanned for all .json and .properties files.
    `,
    'Configuration may also be set in package.json or messageformat.rc.json.'
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
        default: ['.json', '.properties']
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
