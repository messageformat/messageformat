export declare function testScenarios(root: string): Iterable<TestScenario>;
export declare function testCases(scenario: TestScenario): Iterable<Test>;
export declare function testName(test: Test): string;
export declare function testType(
  tc: Test
): 'valid' | 'syntax-error' | 'data-model-error' | 'error';

/** The main schema for MessageFormat 2 test data. */
export type TestScenario = {
  /** Identifier for the tests in the file. */
  scenario: string;

  /** Information about the test scenario. */
  description?: string;

  defaultTestProperties?: DefaultTestProperties;

  tests: TestData[];
};

export type DefaultTestProperties = {
  /** The locale to use for formatting. */
  locale?: string;

  /** The MF2 syntax source. */
  src?: string;

  /** The bidi isolation strategy. */
  bidiIsolation?: 'default' | 'none';

  /** Parameters to pass in to the formatter for resolving external variables. */
  params?: Array<
    | { name: string; value: unknown }
    | { name: string; type: 'datetime'; value: string }
  >;

  /** List of features that the test relies on. */
  tags?: string[];

  /** The expected result of formatting the message to a string. */
  exp?: string;

  /** The expected normalized form of `src`, for testing stringifiers. */
  expCleanSrc?: string;

  /** The expected result of formatting the message to parts. */
  expParts?: ExpPart[];

  /**
   * The runtime errors expected to be emitted when formatting the message.
   * If expErrors is either absent or empty, the message must be formatted without errors.
   */
  expErrors?: ExpError[] | boolean;
};

export type TestData = DefaultTestProperties & {
  /** Information about the test. */
  description?: string;

  /** A flag to use during development to only run one or more specific tests. */
  only?: boolean;
};

export type Test = Omit<TestData, 'params'> & {
  /** Set either in defaults or directly in the test. */
  locale: string;

  /** Set either in defaults or directly in the test. */
  src: string;

  params?: Record<string, unknown>;
};

type ExpPart =
  | {
      type: 'literal';
      value: string;
    }
  | {
      type: 'markup';
      kind: 'open' | 'standalone' | 'close';
      name: string;
      options?: Record<string, unknown>;
    }
  | {
      type: string;
      locale?: string;
      parts?: {
        type: string;
        value?: unknown;
        [k: string]: unknown;
      }[];
      value?: unknown;
      [k: string]: unknown;
    };

type ExpError = {
  type:
    | 'syntax-error'
    | 'variant-key-mismatch'
    | 'missing-fallback-variant'
    | 'missing-selector-annotation'
    | 'duplicate-declaration'
    | 'duplicate-option-name'
    | 'unresolved-variable'
    | 'unknown-function'
    | 'unsupported-expression'
    | 'unsupported-statement'
    | 'bad-selector'
    | 'bad-operand'
    | 'bad-option'
    | 'bad-variant-key';
};
