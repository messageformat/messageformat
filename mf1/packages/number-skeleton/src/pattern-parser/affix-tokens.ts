import { PatternError } from '../errors.js';

export type AffixToken =
  | { char: '%'; width: number; style: 'percent' | 'permille' }
  | {
      char: '¤';
      width: number;
      currency: 'default' | 'iso-code' | 'full-name' | 'narrow';
    }
  | { char: '*'; width: number; pad: string }
  | { char: '+' | '-'; width: number }
  | { char: "'"; width: number; str: string };

export function parseAffixToken(
  src: string,
  pos: number,
  onError: (err: PatternError) => void
): AffixToken | null {
  const char = src[pos];
  switch (char) {
    case '%':
      return { char: '%', style: 'percent', width: 1 };
    case '‰':
      return { char: '%', style: 'permille', width: 1 };
    case '¤': {
      let width = 1;
      while (src[++pos] === '¤') ++width;
      switch (width) {
        case 1:
          return { char, currency: 'default', width };
        case 2:
          return { char, currency: 'iso-code', width };
        case 3:
          return { char, currency: 'full-name', width };
        case 5:
          return { char, currency: 'narrow', width };
        default: {
          const msg = `Invalid number (${width}) of ¤ chars in pattern`;
          onError(new PatternError('¤', msg));
          return null;
        }
      }
    }
    case '*': {
      const pad = src[pos + 1];
      if (pad) return { char, pad, width: 2 };
      break;
    }
    case '+':
    case '-':
      return { char, width: 1 };
    case "'": {
      let str = src[++pos];
      let width = 2;
      if (str === "'") return { char, str, width };
      while (true) {
        const next = src[++pos];
        ++width;
        if (next === undefined) {
          const msg = `Unterminated quoted literal in pattern: ${str}`;
          onError(new PatternError("'", msg));
          return { char, str, width };
        } else if (next === "'") {
          if (src[++pos] !== "'") return { char, str, width };
          else ++width;
        }
        str += next;
      }
    }
  }
  return null;
}
