import {
  Expression,
  isVariableRef,
  VariableRef,
  type Message,
  type Pattern,
  Literal
} from 'messageformat';
import type { JsonMessage } from './types';

const fixName = (name: string) => name.replace(/[^\w@]g/, '_').toLowerCase();

export function messageToExtensionJson(
  source: Message,
  target: Message
): JsonMessage {
  const ext = findExternalVariables(source).map(fixName);
  let placeholders: JsonMessage['placeholders'] = undefined;
  let pattern: Pattern | undefined = undefined;
  switch (target.type) {
    case 'message':
      pattern = target.pattern;
      break;
    case 'select':
      for (const { keys, value } of target.variants) {
        if (keys.every(key => key.type === '*')) {
          pattern = value;
          break;
        }
      }
      break;
    default:
      throw new Error(`Unexpected ${target.type} message`);
  }
  if (!pattern) throw new Error('Message pattern not found');
  let message = '';
  for (const el of pattern.body) {
    switch (el.type) {
      case 'text':
        message += el.value.replace(/\$+/g, '$&$');
        break;
      case 'expression': {
        let ph = el.body;
        switch (ph.type) {
          case 'variable':
            ph = resolveValue(target, ph);
            break;
          case 'function':
            ph = resolveValue(target, ph.operand);
            break;
        }
        switch (ph.type) {
          case 'literal':
            message += ph.value.replace(/\$+/g, '$&$');
            break;
          case 'variable': {
            const name = fixName(ph.name);
            message += `$${name}`;
            const idx = ext.indexOf(name) + 1;
            if (idx === 0) {
              throw new Error(`Variable not in source message: $${name}`);
            }
            placeholders ??= {};
            placeholders[name] = { content: `$${idx}` };
            break;
          }
          default:
            throw new Error(`Unsupported placeholder: ${ph.type}`);
        }
        break;
      }
      default:
        throw new Error(`Unsupported placeholder: ${el.type}`);
    }
  }
  return placeholders ? { message, placeholders } : { message };
}

function findExternalVariables(msg: Message) {
  const ext: string[] = [];
  const local: string[] = [];
  const addVar = (name: string) => {
    if (!local.includes(name) && !ext.includes(name)) ext.push(name);
  };
  const addExpression = (exp: Expression) => {
    switch (exp.body.type) {
      case 'variable':
        addVar(exp.body.name);
        break;
      case 'function': {
        const { operand, options } = exp.body;
        if (isVariableRef(operand)) addVar(operand.name);
        if (options) {
          for (const opt of options) {
            if (isVariableRef(opt.value)) addVar(opt.value.name);
          }
        }
      }
    }
  };
  const addPattern = (pattern: Pattern) => {
    for (const el of pattern.body) {
      if (el.type === 'expression') addExpression(el);
    }
  };
  for (const { target, value } of msg.declarations) {
    if (value.type === 'expression') addExpression(value);
    if (isVariableRef(target)) local.push(target.name);
  }
  switch (msg.type) {
    case 'message':
      addPattern(msg.pattern);
      break;
    case 'select':
      for (const sel of msg.selectors) {
        if (sel.type === 'expression') addExpression(sel);
      }
      for (const { value } of msg.variants) addPattern(value);
  }
  return ext;
}

function resolveValue(
  msg: Message,
  ref: Literal | VariableRef | undefined
): Literal | VariableRef {
  if (!ref) {
    throw new Error('Unsupported placeholder: function without operand');
  }
  if (ref.type === 'literal') return ref;
  for (let i = msg.declarations.length - 1; i >= 0; --i) {
    const { target, value } = msg.declarations[i];
    if (target.name === ref.name) {
      if (value.type !== 'expression') {
        throw new Error(`Unsupported declaration value: ${value.type}`);
      }
      switch (value.body.type) {
        case 'literal':
          return value.body;
        case 'variable':
          ref = value.body;
          break;
        case 'function': {
          const { operand } = value.body;
          switch (operand?.type) {
            case 'literal':
              return operand;
            case 'variable':
              ref = operand;
              break;
            default:
              throw new Error(
                'Unsupported placeholder: function without operand'
              );
          }
          break;
        }
        default:
          throw new Error(`Unsupported placeholder: ${value.body.type}`);
      }
    }
  }
  return ref;
}
