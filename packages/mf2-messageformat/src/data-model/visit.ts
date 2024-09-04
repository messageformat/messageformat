import type {
  Attributes,
  CatchallKey,
  Declaration,
  Expression,
  FunctionAnnotation,
  Literal,
  Markup,
  Message,
  MessageNode,
  Options,
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
    attributes?: (
      attributes: Attributes,
      context: 'declaration' | 'selector' | 'placeholder'
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
    options?: (
      options: Options,
      context: 'declaration' | 'selector' | 'placeholder'
    ) => (() => void) | void;
    pattern?: (pattern: Pattern) => (() => void) | void;
    value?: (
      value: Literal | VariableRef,
      context: 'declaration' | 'selector' | 'placeholder',
      position: 'arg' | 'option' | 'attribute'
    ) => void;
    variant?: (variant: Variant) => (() => void) | void;
  }
) {
  const { node, pattern } = visitors;
  const {
    annotation = node,
    attributes = null,
    declaration = node,
    expression = node,
    key = node,
    markup = node,
    options = null,
    value = node,
    variant = node
  } = visitors;

  const handleOptions = (
    options_: Options | undefined,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (options_) {
      const end = options?.(options_, context);
      if (value) {
        for (const value_ of options_.values()) {
          value(value_, context, 'option');
        }
      }
      end?.();
    }
  };

  const handleAttributes = (
    attributes_: Attributes | undefined,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (attributes_) {
      const end = attributes?.(attributes_, context);
      if (value) {
        for (const value_ of attributes_.values()) {
          if (value_ !== true) value(value_, context, 'attribute');
        }
      }
      end?.();
    }
  };

  const handleElement = (
    exp: string | Expression | Markup,
    context: 'declaration' | 'selector' | 'placeholder'
  ) => {
    if (typeof exp === 'object') {
      let end: (() => void) | void | undefined;
      switch (exp.type) {
        case 'expression': {
          end = expression?.(exp, context);
          if (exp.arg) value?.(exp.arg, context, 'arg');
          if (exp.annotation) {
            const endA = annotation?.(exp.annotation, context, exp.arg);
            handleOptions(exp.annotation.options, context);
            endA?.();
          }
          handleAttributes(exp.attributes, context);
          break;
        }
        case 'markup': {
          end = context !== 'selector' ? markup?.(exp, context) : undefined;
          handleOptions(exp.options, context);
          handleAttributes(exp.attributes, context);
          break;
        }
      }
      end?.();
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
