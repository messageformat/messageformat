import type * as AST from '@messageformat/parser';
import type {
  FunctionReference,
  Message,
  Part,
  Select,
  VariableReference
} from 'messageformat';

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
  for (const token of tokens)
    if (isAstSelect(token)) {
      add(asSelectArg(token));
      for (const c of token.cases)
        for (const arg of findSelectArgs(c.tokens)) add(arg);
    }
  return args;
}

function tokenToPart(
  token: AST.Token,
  pluralArg: string | null,
  pluralOffset: number | null
): Part {
  switch (token.type) {
    case 'content':
      return token.value;
    case 'argument':
      return { var_path: [token.arg] };
    case 'function': {
      const fnRef: FunctionReference = {
        func: token.key,
        args: [{ var_path: [token.arg] }]
      };
      if (token.param && token.param.length > 0) {
        let param = '';
        for (const pt of token.param) {
          if (pt.type === 'content') param += pt.value;
          else throw new Error(`Unsupported param type: ${pt.type}`);
        }
        fnRef.options = { param };
      }
      return fnRef;
    }
    case 'octothorpe': {
      if (!pluralArg) return '#';
      const fnRef: FunctionReference = {
        func: 'number',
        args: [{ var_path: [pluralArg] }]
      };
      if (pluralOffset) fnRef.options = { pluralOffset };
      return fnRef;
    }
    /* istanbul ignore next - never happens */
    default:
      throw new Error(`Unsupported token type: ${token.type}`);
  }
}

function argToPart({ arg, pluralOffset, type }: SelectArg) {
  const varRef: VariableReference = { var_path: [arg] };
  if (type === 'select') return varRef;
  const fnRef: FunctionReference = { func: 'plural', args: [varRef] };
  if (type === 'selectordinal') {
    fnRef.options = pluralOffset
      ? { pluralOffset, type: 'ordinal' }
      : { type: 'ordinal' };
  } else if (pluralOffset) fnRef.options = { pluralOffset };
  return fnRef;
}

/**
 * Converts the `@messageformat/parser` AST representation of a
 * MessageFormat 1 message into the corresponding MessageFormat 2
 * data model.
 *
 * If the source message contains any inner selectors, they will be
 * lifted into a single top-level selector.
 *
 * In addition to `number` and other default MF1 formatters, a
 * `plural` runtime function is expected, accepting these options:
 * ```ts
 * {
 *   pluralOffset?: number
 *   type: 'cardinal' | 'ordinal' = 'cardinal'
 * }
 * ```
 *
 * Only literal values are supported in formatter parameters. Any
 * such value will be passed in as an option `{ param: string }`.
 */
export function astToMessage(ast: AST.Token[]): Message {
  const args = findSelectArgs(ast);
  if (args.length === 0)
    return { value: ast.map(token => tokenToPart(token, null, null)) };

  // First determine the keys for all cases, with empty values
  let keys: (string | number)[][] = [];
  for (let i = 0; i < args.length; ++i) {
    const kk = Array.from(new Set(args[i].keys));
    const io = kk.indexOf('other');
    if (io !== kk.length - 1) {
      if (io !== -1) kk.splice(io, 1);
      kk.push('other');
    }
    if (i === 0) keys = kk.map(key => [key]);
    else
      for (let i = keys.length - 1; i >= 0; --i)
        keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
  }
  const cases: Select['cases'] = keys.map(key => ({ key, value: [] }));

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
        const part = tokenToPart(token, pluralArg, pluralOffset);
        for (const c of cases)
          if (filter.every(({ idx, value }) => c.key[idx] === value)) {
            const end = c.value.length - 1;
            if (typeof c.value[end] === 'string' && typeof part === 'string')
              c.value[end] += part;
            else c.value.push(part);
          }
      }
    }
  }
  addParts(ast, null, null, []);

  return { value: { select: args.map(argToPart), cases } };
}
