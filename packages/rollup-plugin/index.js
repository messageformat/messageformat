const { createFilter } = require('@rollup/pluginutils');
const MessageFormat = require('messageformat');
const compileModule = require('messageformat/compile-module');
const YAML = require('yaml');

module.exports = function mfPlugin({
  exclude,
  include,
  locales,
  ...mfOpt
} = {}) {
  let getLocale;
  if (!locales) {
    if (!include) include = [/\bmessages\.(json|yaml|yml)$/];
    getLocale = () => null;
  } else {
    const lca = Array.isArray(locales) ? locales : [locales];
    if (!include) {
      const ls = `[._-](${lca.join('|')})`;
      include = [new RegExp(`\\bmessages(${ls})?\\.(json|yaml|yml)$`)];
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
    transform(src, id) {
      if (!filter(id)) return null;
      const messages = YAML.parse(src);
      const mf = new MessageFormat(getLocale(id), mfOpt);
      return compileModule(mf, messages);
    }
  };
};
