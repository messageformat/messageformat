import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

/** @import { Test, TestScenario } from "./mfwg-test-utils" */

/**
 * @param {string} root
 * @returns {Iterable<TestScenario>}
 */
export function* testScenarios(root) {
  for (const ent of readdirSync(root, {
    recursive: true,
    withFileTypes: true
  })) {
    if (ent.isFile() && ent.name.endsWith('.json')) {
      const path = join(ent.path ?? ent.parentPath, ent.name);
      const src = readFileSync(path, { encoding: 'utf-8' });
      const ts = JSON.parse(src);
      ts.scenario ||= relative(root, path);
      yield ts;
    }
  }
}

/**
 * @param {TestScenario} scenario
 * @returns {Iterable<Test>}
 */
export function* testCases(scenario) {
  const defaults = scenario.defaultTestProperties;
  for (const test of scenario.tests) {
    const td = Object.assign({}, defaults, test);
    /** @type Test */
    const tt = td;
    if (td.params) {
      const pr = {};
      for (const p of td.params) {
        pr[p.name] =
          'type' in p && p.type === 'datetime' ? new Date(p.value) : p.value;
      }
      tt.params = pr;
    }
    yield tt;
  }
}

/**
 * @param {Test} test
 * @returns {string}
 */
export function testName({ src, locale, params }) {
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
  'duplicate-attribute',
  'duplicate-declaration',
  'duplicate-option-name',
  'duplicate-variant',
  'missing-fallback-variant',
  'missing-selector-annotation',
  'variant-key-mismatch'
];

/**
 * @param {Test} tc
 * @returns {'valid' | 'syntax-error' | 'data-model-error' | 'error'}
 */
export function testType(tc) {
  if (!tc.expErrors) return 'valid';
  if (Array.isArray(tc.expErrors)) {
    for (const ee of tc.expErrors) {
      if (ee.type === 'syntax-error') return 'syntax-error';
      if (dataModelErrors.includes(ee.type)) return 'data-model-error';
    }
  }
  return 'error';
}
