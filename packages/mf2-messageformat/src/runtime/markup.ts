import type { MessageExpressionPart, MessageValue } from './index.js';

export interface MessageMarkup extends MessageValue {
  readonly type: 'open' | 'close';
  readonly source: string;
  readonly locale: 'und';
  readonly name: string;
  readonly options: Record<string, unknown>;
  toParts(): [MessageMarkupPart];
  toString(): '';
  valueOf?: () => unknown;
}

export interface MessageMarkupPart extends MessageExpressionPart {
  type: 'open' | 'close';
  source: string;
  name: string;
  value?: unknown;
  options?: { [key: string]: unknown };
}

function getValue(value: unknown): unknown {
  if (typeof value === 'object' && typeof value?.valueOf === 'function') {
    const vv = value.valueOf();
    if (vv !== value) return vv;
  }
  return value;
}

export function markup(
  source: string,
  type: 'open' | 'close',
  name: string,
  options?: Record<string, unknown>,
  input?: unknown
): MessageMarkup {
  const value = getValue(input);

  let opt: Record<string, unknown> | undefined;
  if (options) {
    opt = {};
    for (const [name, value] of Object.entries(options)) {
      opt[name] = getValue(value);
    }
  }

  const markup: MessageMarkup = {
    type: type,
    source,
    locale: 'und',
    name,
    get options() {
      return { ...opt };
    },
    toParts() {
      const part: MessageMarkupPart = { type, source, name };
      if (input !== undefined) part.value = value;
      if (opt) part.options = opt;
      return [part];
    },
    toString: () => ''
  };
  if (input !== undefined) markup.valueOf = () => value;
  return markup;
}
