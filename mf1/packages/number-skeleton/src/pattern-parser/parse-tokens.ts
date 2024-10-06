import { AffixToken, parseAffixToken } from './affix-tokens.js';
import { NumberToken, parseNumberToken } from './number-tokens.js';
import { PatternError } from '../errors.js';

function parseSubpattern(
  src: string,
  pos: number,
  onError: (err: PatternError) => void
) {
  enum State {
    Prefix,
    Number,
    Suffix
  }

  const prefix: AffixToken[] = [];
  const number: NumberToken[] = [];
  const suffix: AffixToken[] = [];

  let state: State = State.Prefix;
  let str = '';
  while (pos < src.length) {
    const char = src[pos];
    if (char === ';') {
      pos += 1;
      break;
    }

    switch (state) {
      case State.Prefix: {
        const token = parseAffixToken(src, pos, onError);
        if (token) {
          if (str) {
            prefix.push({ char: "'", str, width: str.length });
            str = '';
          }
          prefix.push(token);
          pos += token.width;
        } else {
          const token = parseNumberToken(src, pos);
          if (token) {
            if (str) {
              prefix.push({ char: "'", str, width: str.length });
              str = '';
            }
            state = State.Number;
            number.push(token);
            pos += token.width;
          } else {
            str += char;
            pos += 1;
          }
        }
        break;
      }

      case State.Number: {
        const token = parseNumberToken(src, pos);
        if (token) {
          number.push(token);
          pos += token.width;
        } else {
          state = State.Suffix;
        }
        break;
      }

      case State.Suffix: {
        const token = parseAffixToken(src, pos, onError);
        if (token) {
          if (str) {
            suffix.push({ char: "'", str, width: str.length });
            str = '';
          }
          suffix.push(token);
          pos += token.width;
        } else {
          str += char;
          pos += 1;
        }
        break;
      }
    }
  }
  if (str) suffix.push({ char: "'", str, width: str.length });
  return { pattern: { prefix, number, suffix }, pos };
}

export function parseTokens(src: string, onError: (err: PatternError) => void) {
  const { pattern, pos } = parseSubpattern(src, 0, onError);
  if (pos < src.length) {
    const { pattern: negative } = parseSubpattern(src, pos, onError);
    return { tokens: pattern, negative };
  }
  return { tokens: pattern };
}
