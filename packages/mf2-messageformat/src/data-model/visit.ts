import type {
  Declaration,
  Expression,
  Markup,
  Message,
  Pattern,
  Variant
} from './types.js';

/**
 * Apply visitor functions to a message.
 *
 * @remarks
 * The visitors are applied in data model order, starting from leaf nodes.
 *
 * @beta
 */
export function visit(
  msg: Message,
  visitors: {
    declaration?: (declaration: Declaration) => void;
    expression?: (
      expression: Expression,
      context: 'declaration' | 'selector' | 'placeholder'
    ) => void;
    markup?: (markup: Markup, context: 'declaration' | 'placeholder') => void;
    pattern?: (pattern: Pattern) => void;
    variant?: (variant: Variant) => void;
  }
) {
  const { declaration, expression, markup, pattern, variant } = visitors;

  const handleElement = (
    exp: string | Expression | Markup,
    context: 'declaration' | 'placeholder'
  ) => {
    if (typeof exp === 'object') {
      switch (exp.type) {
        case 'expression':
          expression?.(exp, context);
          break;
        case 'markup':
          markup?.(exp, context);
          break;
      }
    }
  };

  const handlePattern = (pat: Pattern) => {
    for (const el of pat.body) handleElement(el, 'placeholder');
    pattern?.(pat);
  };

  for (const decl of msg.declarations) {
    if (decl.value) {
      expression?.(decl.value, 'declaration');
    } else {
      for (const exp of decl.expressions) handleElement(exp, 'declaration');
    }
    declaration?.(decl);
  }

  if (msg.type === 'message') {
    handlePattern(msg.pattern);
  } else {
    if (expression) {
      for (const sel of msg.selectors) expression(sel, 'selector');
    }
    for (const vari of msg.variants) {
      handlePattern(vari.value);
      variant?.(vari);
    }
  }
}
