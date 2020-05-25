const { createFilter } = require('@rollup/pluginutils');
const { parse } = require('dot-properties');
const { readFile } = require('fs');
const MessageFormat = require('messageformat');
const compileModule = require('messageformat/compile-module');
const uv = require('uv');
const YAML = require('yaml');

module.exports = function mfPlugin({
  exclude,
  include,
  locales,
  propKeyPath = true,
  ...mfOpt
} = {}) {
  let getLocale;
  if (!locales) {
    if (!include) include = [/\.properties$/, /\bmessages\.(json|yaml|yml)$/];
    getLocale = () => null;
  } else {
    const lca = Array.isArray(locales) ? locales : [locales];
    if (!include) {
      const ls = `[._-](${lca.join('|')})`;
      include = [
        /\.properties$/,
        new RegExp(`\\bmessages(${ls})?\\.(json|yaml|yml)$`)
      ];
    }
    getLocale = id => {
      const parts = id.split(/\b|_/);
      for (const lc of lca) if (parts.includes(lc)) return [lc];
      return lca;
    };
  }
  const filter = createFilter(include, exclude);

  return {
    name: 'messageformat',

    load(id) {
      if (!id.endsWith('.properties') || !filter(id)) return null;
      return new Promise((resolve, reject) =>
        readFile(id, (err, buffer) => {
          if (err) reject(err);
          else {
            const encoding = uv(buffer) ? 'utf8' : 'latin1';
            resolve({ code: buffer.toString(encoding) });
          }
        })
      );
    },

    transform(src, id) {
      if (!filter(id)) return null;
      const messages = id.endsWith('.properties')
        ? parse(src, propKeyPath)
        : YAML.parse(src);
      const mf = new MessageFormat(getLocale(id), mfOpt);
      return compileModule(mf, messages);
    }
  };
};
