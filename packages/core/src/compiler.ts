import {
  getDateFormatter,
  getDateFormatterSource
} from '@messageformat/date-skeleton';
import {
  getNumberFormatter,
  getNumberFormatterSource
} from '@messageformat/number-skeleton';
import { parse, FunctionArg, Select, Token } from '@messageformat/parser';
import * as Runtime from '@messageformat/runtime';
import * as Formatters from '@messageformat/runtime/lib/formatters';
import { identifier, property } from 'safe-identifier';
import { biDiMarkText } from './bidi-mark-text';
import { MessageFormatOptions } from './messageformat';
import { PluralObject } from './plurals';

const RUNTIME_MODULE = '@messageformat/runtime';
const CARDINAL_MODULE = '@messageformat/runtime/lib/cardinals';
const PLURAL_MODULE = '@messageformat/runtime/lib/plurals';
const FORMATTER_MODULE = '@messageformat/runtime/lib/formatters';

type RuntimeType = 'formatter' | 'locale' | 'runtime';
interface RuntimeEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]): unknown;
  id?: string | null;
  module?: string | ((_: { locale: string }) => string) | null;
  toString?: () => string;
  type?: RuntimeType;
}
export interface RuntimeMap {
  [key: string]: Required<RuntimeEntry>;
}

/**
 * A hierarchical structure of ICU MessageFormat strings
 *
 * @public
 * @remarks
 * Used in {@link compileModule} arguments
 */
export interface StringStructure {
  [key: string]: StringStructure | string;
}

export default class Compiler {
  arguments: string[] = [];
  options: Required<MessageFormatOptions>;
  declare plural: PluralObject; // Always set in compile()
  runtime: RuntimeMap = {};

  constructor(options: Required<MessageFormatOptions>) {
    this.options = options;
  }

  /**
   * Recursively compile a string or a tree of strings to JavaScript function
   * sources
   *
   * If `src` is an object with a key that is also present in `plurals`, the key
   * in question will be used as the locale identifier for its value. To disable
   * the compile-time checks for plural & selectordinal keys while maintaining
   * multi-locale support, use falsy values in `plurals`.
   *
   * @param src - The source for which the JS code should be generated
   * @param plural - The default locale
   * @param plurals - A map of pluralization keys for all available locales
   */
  compile(
    src: string | StringStructure,
    plural: PluralObject,
    plurals?: { [key: string]: PluralObject }
  ) {
    const { localeCodeFromKey, requireAllArguments, strict, strictPluralKeys } =
      this.options;

    if (typeof src === 'object') {
      const result: StringStructure = {};
      for (const key of Object.keys(src)) {
        const lc = localeCodeFromKey ? localeCodeFromKey(key) : key;
        const pl = (plurals && lc && plurals[lc]) || plural;
        result[key] = this.compile(src[key], pl, plurals);
      }
      return result;
    }

    this.plural = plural;
    const parserOptions = {
      cardinal: plural.cardinals,
      ordinal: plural.ordinals,
      strict,
      strictPluralKeys
    };
    this.arguments = [];
    const r = parse(src, parserOptions).map(token => this.token(token, null));
    const hasArgs = this.arguments.length > 0;
    const res = this.concatenate(r, true);

    if (requireAllArguments && hasArgs) {
      this.setRuntimeFn('reqArgs');
      const reqArgs = JSON.stringify(this.arguments);
      return `(d) => { reqArgs(${reqArgs}, d); return ${res}; }`;
    }

    return `(${hasArgs ? 'd' : ''}) => ${res}`;
  }

  cases(token: Select, pluralToken: Select | null) {
    let needOther = true;
    const r = token.cases.map(({ key, tokens }) => {
      if (key === 'other') needOther = false;
      const s = tokens.map(tok => this.token(tok, pluralToken));
      return `${property(null, key.replace(/^=/, ''))}: ${this.concatenate(
        s,
        false
      )}`;
    });
    if (needOther) {
      const { type } = token;
      const { cardinals, ordinals } = this.plural;
      if (
        type === 'select' ||
        (type === 'plural' && cardinals.includes('other')) ||
        (type === 'selectordinal' && ordinals.includes('other'))
      )
        throw new Error(`No 'other' form found in ${JSON.stringify(token)}`);
    }
    return `{ ${r.join(', ')} }`;
  }

  concatenate(tokens: string[], root: boolean) {
    const asValues = this.options.returnType === 'values';
    return asValues && (root || tokens.length > 1)
      ? '[' + tokens.join(', ') + ']'
      : tokens.join(' + ') || '""';
  }

  token(token: Token, pluralToken: Select | null) {
    if (token.type === 'content') return JSON.stringify(token.value);

    const { id, lc } = this.plural;
    let args: (number | string)[], fn: string;
    if ('arg' in token) {
      this.arguments.push(token.arg);
      args = [property('d', token.arg)];
    } else args = [];
    switch (token.type) {
      case 'argument':
        return this.options.biDiSupport
          ? biDiMarkText(String(args[0]), lc)
          : String(args[0]);

      case 'select':
        fn = 'select';
        if (pluralToken && this.options.strict) pluralToken = null;
        args.push(this.cases(token, pluralToken));
        this.setRuntimeFn('select');
        break;

      case 'selectordinal':
        fn = 'plural';
        args.push(token.pluralOffset || 0, id, this.cases(token, token), 1);
        this.setLocale(id, true);
        this.setRuntimeFn('plural');
        break;

      case 'plural':
        fn = 'plural';
        args.push(token.pluralOffset || 0, id, this.cases(token, token));
        this.setLocale(id, false);
        this.setRuntimeFn('plural');
        break;

      case 'function': {
        const formatter = this.options.customFormatters[token.key];
        const formattingModuleRequest =
          formatter && 'module' in formatter ? formatter.module : null;
        const isModuleFn = typeof formattingModuleRequest === 'function';
        if (!this.options.customFormatters[token.key]) {
          if (token.key === 'date') {
            fn = this.setDateFormatter(token, args, pluralToken);
            break;
          } else if (token.key === 'number') {
            fn = this.setNumberFormatter(token, args, pluralToken);
            break;
          }
        }

        args.push(JSON.stringify(this.plural.locale));
        if (token.param) {
          if (pluralToken && this.options.strict) pluralToken = null;
          const arg = this.getFormatterArg(token, pluralToken);
          if (arg) args.push(arg);
        }
        fn = isModuleFn
          ? identifier(`${token.key}__${this.plural.locale}`)
          : token.key;
        this.setFormatter(fn, token.key);
        break;
      }
      case 'octothorpe':
        /* istanbul ignore if: never happens */
        if (!pluralToken) return '"#"';
        args = [
          JSON.stringify(this.plural.locale),
          property('d', pluralToken.arg),
          pluralToken.pluralOffset || 0
        ];
        if (this.options.strict) {
          fn = 'strictNumber';
          args.push(JSON.stringify(pluralToken.arg));
          this.setRuntimeFn('strictNumber');
        } else {
          fn = 'number';
          this.setRuntimeFn('number');
        }
        break;
    }

    /* istanbul ignore if: never happens */
    if (!fn) throw new Error('Parser error for token ' + JSON.stringify(token));
    return `${fn}(${args.join(', ')})`;
  }

  runtimeIncludes(key: string, type: RuntimeType) {
    if (identifier(key) !== key)
      throw new SyntaxError(`Reserved word used as ${type} identifier: ${key}`);
    const prev = this.runtime[key];
    if (!prev || prev.type === type) return prev;
    throw new TypeError(
      `Cannot override ${prev.type} runtime function as ${type}: ${key}`
    );
  }

  setLocale(key: string, ord: boolean) {
    const prev = this.runtimeIncludes(key, 'locale');
    const { getCardinal, getPlural, isDefault } = this.plural;
    let pf: RuntimeEntry, module, toString;
    if (!ord && isDefault && getCardinal) {
      if (prev) return;
      pf = (n: string | number) => getCardinal(n);
      module = CARDINAL_MODULE;
      /* istanbul ignore next: never actually called */
      toString = () => String(getCardinal);
    } else {
      // overwrite a previous cardinal-only locale function
      if (prev && (!isDefault || prev.module === PLURAL_MODULE)) return;
      pf = (n: string | number, ord?: boolean) => getPlural(n, ord);
      module = isDefault ? PLURAL_MODULE : getPlural.module || null;
      toString = () => String(getPlural);
    }
    this.runtime[key] = Object.assign(pf, {
      id: key,
      module,
      toString,
      type: 'locale'
    });
  }

  setRuntimeFn(
    key: 'number' | 'plural' | 'select' | 'strictNumber' | 'reqArgs'
  ) {
    if (this.runtimeIncludes(key, 'runtime')) return;
    this.runtime[key] = Object.assign(Runtime[key], {
      id: key,
      module: RUNTIME_MODULE,
      type: 'runtime'
    } as const);
  }

  getFormatterArg({ key, param }: FunctionArg, pluralToken: Select | null) {
    const fmt =
      this.options.customFormatters[key] ||
      (isFormatterKey(key) && Formatters[key]);
    /* istanbul ignore if: never happens */
    if (!fmt || !param) return null;
    const argShape = ('arg' in fmt && fmt.arg) || 'string';
    if (argShape === 'options') {
      let value = '';
      for (const tok of param) {
        if (tok.type === 'content') value += tok.value;
        else
          throw new SyntaxError(
            `Expected literal options for ${key} formatter`
          );
      }
      const options: Record<string, string | number | boolean | null> = {};
      for (const pair of value.split(',')) {
        const keyEnd = pair.indexOf(':');
        if (keyEnd === -1) options[pair.trim()] = null;
        else {
          const k = pair.substring(0, keyEnd).trim();
          const v = pair.substring(keyEnd + 1).trim();
          if (v === 'true') options[k] = true;
          else if (v === 'false') options[k] = false;
          else if (v === 'null') options[k] = null;
          else {
            const n = Number(v);
            options[k] = Number.isFinite(n) ? n : v;
          }
        }
      }
      return JSON.stringify(options);
    } else {
      const parts = param.map(tok => this.token(tok, pluralToken));
      if (argShape === 'raw') return `[${parts.join(', ')}]`;
      const s = parts.join(' + ');
      return s ? `(${s}).trim()` : '""';
    }
  }

  setFormatter(key: string, parentKey?: string) {
    if (this.runtimeIncludes(key, 'formatter')) return;
    const cf = this.options.customFormatters[parentKey || key];
    if (cf) {
      const cfo = typeof cf === 'function' ? { formatter: cf } : cf;

      this.runtime[key] = Object.assign(
        cloneFunction(cfo.formatter),
        { type: 'formatter' } as const,
        'module' in cf && cf.module && cf.id
          ? {
              id: identifier(cf.id),
              module:
                typeof cf.module === 'function' && this.plural.locale
                  ? cf.module({ locale: this.plural.locale })
                  : cf.module
            }
          : { id: null, module: null }
      );
    } else if (isFormatterKey(key)) {
      this.runtime[key] = Object.assign(
        cloneFunction(Formatters[key]),
        { type: 'formatter' } as const,
        { id: key, module: FORMATTER_MODULE }
      );
    } else {
      throw new Error(`Formatting function not found: ${key}`);
    }
  }

  setDateFormatter(
    { param }: FunctionArg,
    args: (number | string)[],
    plural: Select | null
  ) {
    const { locale } = this.plural;

    const argStyle = param && param.length === 1 && param[0];
    if (
      argStyle &&
      argStyle.type === 'content' &&
      /^\s*::/.test(argStyle.value)
    ) {
      const argSkeletonText = argStyle.value.trim().substr(2);
      const key = identifier(`date_${locale}_${argSkeletonText}`, true);
      if (!this.runtimeIncludes(key, 'formatter')) {
        const fmt: RuntimeEntry = getDateFormatter(locale, argSkeletonText);
        this.runtime[key] = Object.assign(fmt, {
          id: key,
          module: null,
          toString: () => getDateFormatterSource(locale, argSkeletonText),
          type: 'formatter'
        });
      }
      return key;
    }

    args.push(JSON.stringify(locale));
    if (param && param.length > 0) {
      if (plural && this.options.strict) plural = null;
      const s = param.map(tok => this.token(tok, plural));
      args.push('(' + (s.join(' + ') || '""') + ').trim()');
    }
    this.setFormatter('date');
    return 'date';
  }

  setNumberFormatter(
    { param }: FunctionArg,
    args: (number | string)[],
    plural: Select | null
  ) {
    const { locale } = this.plural;

    if (!param || param.length === 0) {
      // {var, number} can use runtime number(lc, var, offset)
      args.unshift(JSON.stringify(locale));
      args.push('0');
      this.setRuntimeFn('number');
      return 'number';
    }

    args.push(JSON.stringify(locale));
    if (param.length === 1 && param[0].type === 'content') {
      const fmtArg = param[0].value.trim();

      switch (fmtArg) {
        case 'currency':
          args.push(JSON.stringify(this.options.currency));
          this.setFormatter('numberCurrency');
          return 'numberCurrency';
        case 'integer':
          this.setFormatter('numberInteger');
          return 'numberInteger';
        case 'percent':
          this.setFormatter('numberPercent');
          return 'numberPercent';
      }

      // TODO: Deprecate
      const cm = fmtArg.match(/^currency:([A-Z]+)$/);
      if (cm) {
        args.push(JSON.stringify(cm[1]));
        this.setFormatter('numberCurrency');
        return 'numberCurrency';
      }

      const key = identifier(`number_${locale}_${fmtArg}`, true);
      /* istanbul ignore else */
      if (!this.runtimeIncludes(key, 'formatter')) {
        const { currency } = this.options;
        const fmt: RuntimeEntry = getNumberFormatter(locale, fmtArg, currency);
        this.runtime[key] = Object.assign(fmt, {
          id: null,
          module: null,
          toString: () => getNumberFormatterSource(locale, fmtArg, currency),
          type: 'formatter'
        });
      }
      return key;
    }

    /* istanbul ignore next: never happens */
    if (plural && this.options.strict) plural = null;
    const s = param.map(tok => this.token(tok, plural));
    args.push('(' + (s.join(' + ') || '""') + ').trim()');
    args.push(JSON.stringify(this.options.currency));
    this.setFormatter('numberFmt');
    return 'numberFmt';
  }
}

function isFormatterKey(key: string): key is keyof typeof Formatters {
  return key in Formatters;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cloneFunction<T extends (...args: any[]) => any>(fn: T): T {
  return Object.assign(fn.bind({}), {
    ...fn.prototype,
    toString: () => String(fn)
  });
}
