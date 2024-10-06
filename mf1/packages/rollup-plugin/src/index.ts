import { LoadResult } from 'rollup';
import { FilterPattern, createFilter } from '@rollup/pluginutils';
import { parse } from 'dot-properties';
import { readFile } from 'fs';
import MessageFormat, { MessageFormatOptions } from '@messageformat/core';
import compileModule from '@messageformat/core/compile-module';
import uv from 'uv';
import YAML from 'yaml';

interface PluginArgs extends MessageFormatOptions {
  /**
   * Files to exclude. A valid `minimatch` pattern, or an array of such patterns.
   */
  exclude?: FilterPattern;
  /**
   * Files to include. A valid `minimatch` pattern, or an array of such patterns.
   *
   * By default, includes all `.properties` files and `.json`, `.yaml` & `.yml`
   * files that include `messages` before the extension. If locales are defined,
   * also matches `messages[./_-]lc.ext` where `lc` is the locale and `ext` one
   * of the above extensions.
   *
   * Examples of default matches: `foo.properties`, `messages.json`,
   * `bar-messages.yaml`, `messages/en.json` (if the `en` locale is explicitly
   * set)
   */
  include?: FilterPattern;
  /**
   * Define the message locale or locales. If given multiple valid locales, the
   * first will be the default. Messages under matching locale keys or in a file
   * with a name that includes a locale key will use that for pluralisation.
   *
   * If `locales` has the special value `'*'`, it will match *all* available
   * locales. This may be useful if you want your messages to be completely
   * determined by your data, but may provide surprising results if your input
   * message object includes any 2-3 character keys that are not locale
   * identifiers.
   *
   * Default: `'en'`
   */
  locales?: string | string[];
  /**
   * If true, dots `.` in .properties file keys will be parsed as path
   * separators, resulting in a multi-level object.
   *
   * Default: `true`
   */
  propKeyPath?: boolean;
}

export function messageformat({
  exclude,
  include,
  locales,
  propKeyPath = true,
  ...mfOpt
}: PluginArgs = {}) {
  let getLocale: (id: string) => string[] | null;
  if (!locales) {
    if (!include) include = [/\.properties$/, /\bmessages\.(json|yaml|yml)$/];
    getLocale = () => null;
  } else {
    const lca = Array.isArray(locales) ? locales : [locales];
    if (!include) {
      const ls = `[./_-](${lca.join('|')})`;
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

    load(id: string) {
      if (!id.endsWith('.properties') || !filter(id)) return null;
      return new Promise<LoadResult>((resolve, reject) =>
        readFile(id, (err, buffer) => {
          if (err) {
            reject(err);
          } else {
            const encoding = uv(buffer) ? 'utf8' : 'latin1';
            resolve({ code: buffer.toString(encoding) });
          }
        })
      );
    },

    transform(src: string, id: string) {
      if (!filter(id)) return null;
      const messages = id.endsWith('.properties')
        ? parse(src, propKeyPath)
        : YAML.parse(src);
      const mf = new MessageFormat(getLocale(id), mfOpt);
      const code = compileModule(mf, messages);
      return { code, moduleSideEffects: false, syntheticNamedExports: true };
    }
  };
}
