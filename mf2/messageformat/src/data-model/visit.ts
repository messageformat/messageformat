import type {
  Attributes,
  CatchallKey,
  Declaration,
  Expression,
  FunctionRef,
  Literal,
  Markup,
  Message,
  Node,
  Options,
  Pattern,
  VariableRef,
  Variant
} from './types.ts';

/**
 * Apply visitor functions to message nodes.
 *
 * The visitors are applied in source order, starting from the root.
 * Visitors for nodes that contain other nodes may return a callback function
 * that will be called with no arguments when exiting the node.
 *
 * If set, the `node` visitor is called for all {@link Node} values
 * for which an explicit visitor is not defined.
 *
 * Many visitors will be called with additional arguments
 * identifying some of the context for the visited node.
 *
 * @category Message Data Model
 */
export function visit(
  msg: Message,
  visitors: {
    attributes?: (
      attributes: Attributes,
      context: 'declaration' | 'placeholder'
    ) => (() => void) | void;
    declaration?: (declaration: Declaration) => (() => void) | void;
    expression?: (
      expression: Expression,
      context: 'declaration' | 'placeholder'
    ) => (() => void) | void;
    functionRef?: (
      functionRef: FunctionRef,
      context: 'declaration' | 'placeholder',
      argument: Literal | VariableRef | undefined
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
    node?: (node: Node, ...rest: unknown[]) => void;
    options?: (
      options: Options,
      context: 'declaration' | 'placeholder'
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
    functionRef = node,
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
    context: 'declaration' | 'placeholder'
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
    context: 'declaration' | 'placeholder'
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
    context: 'declaration' | 'placeholder'
  ) => {
    if (typeof exp === 'object') {
      let end: (() => void) | void | undefined;
      switch (exp.type) {
        case 'expression': {
          end = expression?.(exp, context);
          if (exp.arg) value?.(exp.arg, context, 'arg');
          if (exp.functionRef) {
            const endA = functionRef?.(exp.functionRef, context, exp.arg);
            handleOptions(exp.functionRef.options, context);
            endA?.();
          }
          handleAttributes(exp.attributes, context);
          break;
        }
        case 'markup': {
          end = markup?.(exp, context);
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
    end?.();
  }

  if (msg.type === 'message') {
    handlePattern(msg.pattern);
  } else {
    if (value) for (const sel of msg.selectors) value(sel, 'selector', 'arg');
    for (const vari of msg.variants) {
      const end = variant?.(vari);
      if (key) vari.keys.forEach(key);
      handlePattern(vari.value);
      end?.();
    }
  }
}
