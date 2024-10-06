export type NumberToken =
  | { char: '.'; width: number }
  | { char: '#'; width: number }
  | { char: ','; width: number }
  | { char: '0'; width: number; digits: string }
  | { char: '@'; width: number; min: number }
  | { char: 'E'; width: number; expDigits: number; plus: boolean };

const isDigit = (char: string) => char >= '0' && char <= '9';

export function parseNumberToken(src: string, pos: number): NumberToken | null {
  const char = src[pos];

  if (isDigit(char)) {
    let digits = char;
    while (true) {
      const next = src[++pos];
      if (isDigit(next)) digits += next;
      else return { char: '0', digits, width: digits.length };
    }
  }

  switch (char) {
    case '#': {
      let width = 1;
      while (src[++pos] === '#') ++width;
      return { char, width };
    }

    case '@': {
      let min = 1;
      while (src[++pos] === '@') ++min;
      let width = min;
      pos -= 1;
      while (src[++pos] === '#') ++width;
      return { char, min, width };
    }

    case 'E': {
      const plus = src[pos + 1] === '+';
      if (plus) ++pos;
      let expDigits = 0;
      while (src[++pos] === '0') ++expDigits;
      const width = (plus ? 2 : 1) + expDigits;
      if (expDigits) return { char, expDigits, plus, width };
      else break;
    }

    case '.':
    case ',':
      return { char, width: 1 };
  }
  return null;
}
