import { LoadResult } from 'rollup'
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { parse } from 'dot-properties';
import { readFile } from 'fs';
import MessageFormat, { MessageFormatOptions } from 'messageformat';
import compileModule from 'messageformat/compile-module';
import uv from 'uv';
import YAML from 'yaml';

interface PluginArgs extends MessageFormatOptions {
  exclude?: FilterPattern;
  include?: FilterPattern;
  locales?: string | string[];
  propKeyPath?: boolean;
}

export default function mfPlugin({
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
          if (err) reject(err);
          else {
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
};
