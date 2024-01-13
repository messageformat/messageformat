import type {
  CatchallKey,
  Declaration,
  Expression,
  FunctionAnnotation,
  Literal,
  Markup,
  Message,
  MessageNode,
  Option,
  Pattern,
  UnsupportedAnnotation,
  VariableRef,
  Variant
} from './types.js';

/**
 * Apply visitor functions to message nodes.
 *
 * @remarks
 * The visitors are applied in source order, starting from the root.
 * Visitors for nodes that contain other nodes may return a callback function
 * that will be called with no arguments when exiting the node.
 *
 * If set, the `node` visitor is called for all {@link MessageNode} values
 * for which an explicit visitor is not defined.
 *
 * Many visitors will be called with additional arguments
 * identifying some of the context for the visited node.
 *
 * @beta
 */
export function visit(
  msg: Message,
  visitors: {
    annotation?: (
      annotation: FunctionAnnotation | UnsupportedAnnotation,
      context: 'declaration' | 'selector' | 'placeholder',
      argument: Literal | VariableRef | undefined
    ) => (() => void) | void;
    declaration?: (declaration: Declaration) => (() => void) | void;
    expression?: (
      expression: Expression,
      context: 'declaration' | 'selector' | 'placeholder'
    ) => (() => void) | void;
    key?: (
      key: Literal | CatchallKey,
      index: number,
      keys: (Literal | CatchallKey)[]
    ) => void;
    markup?: (
      markup: Markup,
      context: 'declaration' | 'placeholder'
    ) => (() => void) | void;
    node?: (node: MessageNode, ...rest: unknown[]) => void;
    option?: (
      option: Option,
      index: number,
      options: Option[],
      context: 'declaration' | 'selector' | 'placeholder'
    ) => (() => void) | void;
    pattern?: (pattern: Pattern) => (() => void) | void;
    value?: (
      value: Literal | VariableRef,
      context: 'declaration' | 'selector' | 'placeholder',
      position: 'arg' | 'option'
    ) => void;
    variant?: (variant: Variant) => (() => void) | void;
  }
) {
  const { node, pattern } = visitors;
  const {
    annotation = node,
    declaration = node,
    expression = node,
    key = node,
    markup = node,
    option = node,
    value = node,
    variant = node
  } = visitors;

  const handleOptions = (
    options: Option[] | undefined,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (options) {
      for (let i = 0; i < options.length; ++i) {
        const opt = options[i];
        const end = option?.(opt, i, options, context);
        value?.(opt.value, context, 'option');
        end?.();
      }
    }
  };

  const handleElement = (
    exp: string | Expression | Markup,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (typeof exp === 'object') {
      switch (exp.type) {
        case 'expression': {
          const endE = expression?.(exp, context);
          if (exp.arg) value?.(exp.arg, context, 'arg');
          if (exp.annotation) {
            const endA = annotation?.(exp.annotation, context, exp.arg);
            handleOptions(exp.annotation.options, context);
            endA?.();
          }
          endE?.();
          break;
        }
        case 'markup': {
          const end =
            context !== 'selector' ? markup?.(exp, context) : undefined;
          handleOptions(exp.options, context);
          end?.();
          break;
        }
      }
    }
  };

  const handlePattern = (pat: Pattern) => {
    const end = pattern?.(pat);
    for (const el of pat) handleElement(el, 'placeholder');
    end?.();
  };

  for (const decl of msg.declarations) {
    const end = declaration?.(decl);
    if (decl.value) handleElement(decl.value, 'declaration');
    else for (const exp of decl.expressions) handleElement(exp, 'declaration');
    end?.();
  }

  if (msg.type === 'message') {
    handlePattern(msg.pattern);
  } else {
    for (const sel of msg.selectors) handleElement(sel, 'selector');
    for (const vari of msg.variants) {
      const end = variant?.(vari);
      if (key) vari.keys.forEach(key);
      handlePattern(vari.value);
      end?.();
    }
  }
}
