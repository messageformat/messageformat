import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

export function* testScenarios(root: string): Iterable<TestScenario> {
  for (const ent of readdirSync(root, {
    recursive: true,
    withFileTypes: true
  })) {
    if (ent.isFile() && ent.name.endsWith('.json')) {
      const path = join(ent.path, ent.name);
      const src = readFileSync(path, { encoding: 'utf-8' });
      const ts: TestScenario = JSON.parse(src);
      ts.scenario ||= relative(root, path);
      yield ts;
    }
  }
}

export function* testCases(scenario: TestScenario): Iterable<Test> {
  const defaults = scenario.defaultTestProperties;
  for (const test of scenario.tests) {
    const td = Object.assign({}, defaults, test);
    const tt = td as Test;
    if (td.params) {
      const pr: Record<string, unknown> = {};
      for (const p of td.params) {
        pr[p.name] =
          'type' in p && p.type === 'datetime' ? new Date(p.value) : p.value;
      }
      tt.params = pr;
    }
    yield tt;
  }
}

export function testName({ src, locale, params }: Test) {
  let name = src;
  if (locale !== 'en-US') name += ` [${locale}]`;
  if (params) {
    name += ` / {${Object.entries(params)
      .map(p => ` ${p[0]}: ${p[1]}`)
      .join()} }`;
  }
  return name.replace(/ *\n */g, ' ');
}

const dataModelErrors = [
  'duplicate-declaration',
  'duplicate-option-name',
  'missing-fallback-variant',
  'missing-selector-annotation',
  'variant-key-mismatch'
];
export function testType(tc: Test) {
  if (!tc.expErrors) return 'valid';
  if (Array.isArray(tc.expErrors)) {
    for (const ee of tc.expErrors) {
      if (ee.type === 'syntax-error') return 'syntax-error';
      if (dataModelErrors.includes(ee.type)) return 'data-model-error';
    }
  }
  return 'error';
}

/** The main schema for MessageFormat 2 test data. */
type TestScenario = {
  /** Identifier for the tests in the file. */
  scenario: string;

  /** Information about the test scenario. */
  description?: string;

  defaultTestProperties?: DefaultTestProperties;

  tests: TestData[];
};

type DefaultTestProperties = {
  /** The locale to use for formatting. */
  locale?: string;

  /** The MF2 syntax source. */
  src?: string;

  /** Parameters to pass in to the formatter for resolving external variables. */
  params?: Array<
    | { name: string; value: unknown }
    | { name: string; type: 'datetime'; value: string }
  >;

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
      source?: string;
      name: string;
      options?: Record<string, unknown>;
    }
  | {
      type: string;
      source: string;
      locale?: string;
      parts?: {
        type: string;
        source?: string;
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
