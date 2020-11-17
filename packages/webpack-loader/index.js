const loaderUtils = require('loader-utils');
const MessageFormat = require('@messageformat/core');
const compileModule = require('@messageformat/core/compile-module');
const convertToMessageFormat = require('@messageformat/convert');
const { parse } = require('dot-properties');
const { relative } = require('path');
const uv = require('uv');
const YAML = require('yaml');

function localeFromResourcePath(resourcePath, locales) {
  const parts = resourcePath.split(/[._/\\]+/);
  let locale = null;
  let lcPos = -1;
  for (const lc of locales) {
    const idx = parts.indexOf(lc);
    if (idx > lcPos) {
      locale = lc;
      lcPos = idx;
    }
  }
  return locale || locales;
}

module.exports = function loadMessages(content) {
  let { convert, encoding, locale, propKeyPath = true, ...mfOpt } =
    loaderUtils.getOptions(this) || {};

  if (!encoding || encoding === 'auto')
    encoding = uv(content) ? 'utf8' : 'latin1';
  const input = content.toString(encoding);

  let messages = this.resourcePath.endsWith('.properties')
    ? parse(input, propKeyPath)
    : YAML.parse(input);

  if (convert) {
    const cm = convertToMessageFormat(messages, convert);
    if (!locale) locale = cm.locales;
    messages = cm.translations;
  }

  if (typeof locale === 'string' && locale.indexOf(',') !== -1)
    locale = locale.split(',');
  if (Array.isArray(locale) && locale.length > 1) {
    const relPath = relative(process.cwd(), this.resourcePath);
    locale = localeFromResourcePath(relPath, locale);
  }

  const messageFormat = new MessageFormat(locale, mfOpt);
  return compileModule(messageFormat, messages);
};

// get content as Buffer rather than string
module.exports.raw = true;
