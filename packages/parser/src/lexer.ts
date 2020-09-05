import moo, { Rules } from 'moo';

export const states: { [state: string]: Rules } = {
  body: {
    doubleapos: { match: "''", value: () => "'" },
    quoted: {
      lineBreaks: true,
      match: /'[{}#][^]*?(?<!')'(?!')/u,
      value: src => src.slice(1, -1).replace(/''/g, "'")
    },
    argument: {
      lineBreaks: true,
      match: /\{\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*/u,
      push: 'arg',
      value: src => src.substring(1).trim()
    },
    octothorpe: '#',
    end: { lineBreaks: true, match: /\}\s*/u, pop: 1 },
    content: { lineBreaks: true, match: /[^][^{}#']*/u }
  },
  arg: {
    select: {
      lineBreaks: true,
      match: /,\s*(?:plural|select|selectordinal)\s*,\s*/u,
      next: 'select',
      value: src => src.split(',')[1].trim()
    },
    'func-args': {
      lineBreaks: true,
      match: /,\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*,/u,
      next: 'body',
      value: src => src.split(',')[1].trim()
    },
    'func-simple': {
      lineBreaks: true,
      match: /,\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*/u,
      value: src => src.substring(1).trim()
    },
    end: { match: '}', pop: 1 }
  },
  select: {
    offset: {
      lineBreaks: true,
      match: /offset\s*:\s*\d+\s*/u,
      value: src => src.split(':')[1].trim()
    },
    case: {
      lineBreaks: true,
      match: /(?:=\d+|[^\p{Pat_Syn}\p{Pat_WS}]+)\s*\{\s*/u,
      push: 'body',
      value: src => src.substring(0, src.indexOf('{')).trim()
    },
    end: { match: '}', pop: 1 }
  }
};

export const lexer = moo.states(states);
