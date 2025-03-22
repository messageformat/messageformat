import type * as AST from '@messageformat/parser';
import type { Model as MF } from 'messageformat';

const isAstSelect = (token: AST.Token): token is AST.Select =>
  token.type === 'plural' ||
  token.type === 'select' ||
  token.type === 'selectordinal';

interface SelectArg {
  type: 'plural' | 'select' | 'selectordinal';
  arg: string;
  keys: (string | number)[];
  pluralOffset?: number;
}

const asPluralKey = (key: string) =>
  /^=\d+$/.test(key) ? Number(key.substring(1)) : key;

function asSelectArg(sel: AST.Select) {
  const isPlural = sel.type !== 'select';
  const keys = sel.cases.map(c => (isPlural ? asPluralKey(c.key) : c.key));
  const arg: SelectArg = { type: sel.type, arg: sel.arg, keys };
  if ('pluralOffset' in sel) arg.pluralOffset = sel.pluralOffset;
  return arg;
}

const equalSelectArgs = (a: SelectArg | AST.Select) => (b: SelectArg) =>
  a.arg === b.arg && a.pluralOffset === b.pluralOffset && a.type === b.type;

function findSelectArgs(tokens: AST.Token[]): SelectArg[] {
  const args: SelectArg[] = [];
  const add = (arg: SelectArg) => {
    const prev = args.find(equalSelectArgs(arg));
    if (prev) for (const key of arg.keys) prev.keys.push(key);
    else args.push(arg);
  };
  for (const token of tokens) {
    if (isAstSelect(token)) {
      add(asSelectArg(token));
      for (const c of token.cases) {
        for (const arg of findSelectArgs(c.tokens)) add(arg);
      }
    }
  }
  return args;
}

function tokenToFunctionRef(token: AST.FunctionArg): {
  functionRef: MF.FunctionRef;
  attributes: MF.Attributes;
} {
  const attributes: MF.Attributes = new Map([
    ['mf1:argType', { type: 'literal', value: token.key }]
  ]);
  let argStyle = '';
  if (token.param) {
    for (const pt of token.param) {
      if (pt.type === 'content') argStyle += pt.value;
      else throw new Error(`Unsupported param type: ${pt.type}`);
    }
    argStyle = argStyle.trim();
    attributes.set('mf1:argStyle', { type: 'literal', value: argStyle });
  }

  switch (token.key) {
    case 'date': {
      const month: MF.Literal = { type: 'literal', value: 'short' };
      const options: MF.Options = new Map([
        ['day', { type: 'literal', value: 'numeric' }],
        ['month', month],
        ['year', { type: 'literal', value: 'numeric' }]
      ]);
      switch (argStyle) {
        case 'full':
          month.value = 'long';
          options.set('weekday', { type: 'literal', value: 'long' });
          break;
        case 'long':
          month.value = 'long';
          break;
        case 'short':
          month.value = 'numeric';
          break;
        case '':
        case 'medium':
          break;
        default:
          options.set('mf1:argStyle', { type: 'literal', value: argStyle });
      }
      return {
        functionRef: { type: 'function', name: 'datetime', options },
        attributes
      };
    }

    case 'number':
      switch (argStyle) {
        case 'currency':
          return {
            functionRef: {
              type: 'function',
              name: 'currency',
              options: new Map([
                ['currency', { type: 'literal', value: 'XXX' }]
              ])
            },
            attributes
          };
        case 'integer':
          return {
            functionRef: { type: 'function', name: 'integer' },
            attributes
          };
        case 'percent':
          return {
            functionRef: { type: 'function', name: 'mf1:percent' },
            attributes
          };
        case '':
          return {
            functionRef: { type: 'function', name: 'number' },
            attributes
          };
        default:
          return {
            functionRef: {
              type: 'function',
              name: 'number',
              options: new Map([
                ['mf1:argStyle', { type: 'literal', value: argStyle }]
              ])
            },
            attributes
          };
      }

    case 'time': {
      const options: MF.Options = new Map([
        ['second', { type: 'literal', value: 'numeric' }],
        ['minute', { type: 'literal', value: 'numeric' }],
        ['hour', { type: 'literal', value: 'numeric' }]
      ]);
      switch (argStyle) {
        case 'full':
        case 'long':
          options.set('second', { type: 'literal', value: 'numeric' });
          options.set('timeZoneName', { type: 'literal', value: 'short' });
          break;
        case 'short':
          options.delete('second');
          break;
        case '':
        case 'medium':
          break;
        default:
          options.set('mf1:argStyle', { type: 'literal', value: argStyle });
      }
      return {
        functionRef: { type: 'function', name: 'datetime', options },
        attributes
      };
    }

    default: {
      const functionRef: MF.FunctionRef = {
        type: 'function',
        name: `mf1:${token.key}`
      };
      if (argStyle) {
        functionRef.options = new Map([
          ['mf1:argStyle', { type: 'literal', value: argStyle }]
        ]);
      }
      return { functionRef, attributes };
    }
  }
}

function tokenToPart(
  token: AST.Token,
  pluralArg: string | null
): string | MF.Expression {
  switch (token.type) {
    case 'content':
      return token.value;
    case 'argument':
      return {
        type: 'expression',
        arg: { type: 'variable', name: token.arg }
      };
    case 'function':
      return {
        type: 'expression',
        arg: { type: 'variable', name: token.arg },
        ...tokenToFunctionRef(token)
      };
    case 'octothorpe':
      return pluralArg
        ? { type: 'expression', arg: { type: 'variable', name: pluralArg } }
        : '#';
    /* istanbul ignore next - never happens */
    default:
      throw new Error(`Unsupported token type: ${token.type}`);
  }
}

function argToInputDeclaration({
  arg: name,
  pluralOffset,
  type
}: SelectArg): MF.InputDeclaration {
  let functionRef: MF.FunctionRef;
  if (type === 'select') {
    functionRef = { type: 'function', name: 'string' };
  } else {
    const options: MF.Options = new Map();
    if (type === 'selectordinal') {
      options.set('select', { type: 'literal', value: 'ordinal' });
    }
    if (pluralOffset) {
      options.set('offset', { type: 'literal', value: String(pluralOffset) });
      functionRef = { type: 'function', name: 'mf1:plural', options };
    } else {
      functionRef = { type: 'function', name: 'number' };
      if (options.size) functionRef.options = options;
    }
  }
  return {
    type: 'input',
    name,
    value: {
      type: 'expression',
      arg: { type: 'variable', name },
      functionRef
    }
  };
}

/**
 * Convert an ICU MessageFormat 1 message into a {@link MF.Message | Model.Message} data object.
 *
 * If the source message contains any inner selectors, they will be
 * lifted into a single top-level selector.
 *
 * Only literal values are supported in formatter parameters.
 * Any unsupported `argStyle` value will be included as a {@link MF.Options | Model.Options} value.
 *
 * ```js
 * import { mf1ToMessageData, mf1Validate } from '@messageformat/icu-messageformat-1';
 * import { parse } from '@messageformat/parser';
 *
 * const mf1Msg = parse('The total is {V, number, currency}.');
 * const mf2Msg = mf1ToMessageData(mf1Msg);
 * mf1Validate(mf2Msg);
 * mf2msg;
 * ```
 *
 * ```js
 * {
 *   type: 'message',
 *   declarations: [],
 *   pattern: [
 *     'The total is ',
 *     {
 *       type: 'expression',
 *       arg: { type: 'variable', name: 'V' },
 *       functionRef: {
 *         type: 'function',
 *         name: 'currency',
 *         options: Map(1) { 'currency' => { type: 'literal', value: 'XXX' } }
 *       },
 *       attributes: Map(2) {
 *         'mf1:argType' => { type: 'literal', value: 'number' },
 *         'mf1:argStyle' => { type: 'literal', value: 'currency' }
 *       }
 *     },
 *     '.'
 *   ]
 * }
 * ```
 *
 * @param ast - An ICU MessageFormat message as an array of `@messageformat/parser`
 *   {@link https://messageformat.github.io/messageformat/api/parser.parse/ | AST tokens}.
 */
export function mf1ToMessageData(ast: AST.Token[]): MF.Message {
  const args = findSelectArgs(ast);
  if (args.length === 0) {
    return {
      type: 'message',
      declarations: [],
      pattern: ast.map(token => tokenToPart(token, null))
    };
  }

  // First determine the keys for all cases, with empty values
  let keys: (string | number)[][] = [];
  for (let i = 0; i < args.length; ++i) {
    const kk = Array.from(new Set(args[i].keys));
    kk.sort((a, b) => {
      if (typeof a === 'number' || b === 'other') return -1;
      if (typeof b === 'number' || a === 'other') return 1;
      return 0;
    });
    if (i === 0) {
      keys = kk.map(key => [key]);
    } else {
      for (let i = keys.length - 1; i >= 0; --i) {
        keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
      }
    }
  }
  const variants: MF.Variant[] = keys.map(key => ({
    keys: key.map(k =>
      k === 'other'
        ? { type: '*' }
        : { type: 'literal', quoted: false, value: String(k) }
    ),
    value: []
  }));

  /**
   * This reads `args` and modifies `cases`
   *
   * @param pluralArg - Required by # octothorpes
   * @param filter - Selects which cases we're adding to
   */
  function addParts(
    tokens: readonly AST.Token[],
    pluralArg: string | null,
    pluralOffset: number | null,
    filter: readonly { idx: number; value: string | number }[]
  ) {
    for (const token of tokens) {
      if (isAstSelect(token)) {
        const isPlural = token.type !== 'select';
        const pa = isPlural ? token.arg : pluralArg;
        const po = isPlural ? token.pluralOffset || null : pluralOffset;
        const idx = args.findIndex(equalSelectArgs(token));
        for (const c of token.cases) {
          const value = isPlural ? asPluralKey(c.key) : c.key;
          addParts(c.tokens, pa, po, [...filter, { idx, value }]);
        }
      } else {
        for (const v of variants) {
          const vp = v.value;
          if (
            filter.every(({ idx, value }) => {
              const vi = v.keys[idx];
              return vi.type === '*'
                ? value === 'other'
                : String(value) === vi.value;
            })
          ) {
            const i = vp.length - 1;
            const part = tokenToPart(token, pluralArg);
            if (typeof vp[i] === 'string' && typeof part === 'string') {
              vp[i] += part;
            } else {
              vp.push(part);
            }
          }
        }
      }
    }
  }
  addParts(ast, null, null, []);

  return {
    type: 'select',
    declarations: args.map(argToInputDeclaration),
    selectors: args.map(arg => ({ type: 'variable', name: arg.arg })),
    variants
  };
}
