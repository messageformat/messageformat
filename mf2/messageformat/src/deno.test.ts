// deno-lint-ignore-file no-explicit-any

import { expect, fn } from 'jsr:@std/expect';
import { describe, it } from 'jsr:@std/testing/bdd';

import type { Test } from '../../../test/utils/mfwg-test-utils.ts';
import {
  testCases,
  testName,
  testScenarios,
  testType
} from '../../../test/utils/mfwg-test-utils.ts';

import type { MessageFormatOptions } from './index.ts';
import {
  MessageDataModelError,
  MessageFormat,
  MessageSyntaxError,
  cst,
  messageFromCST,
  parseCST,
  parseMessage,
  stringifyCST,
  stringifyMessage,
  validate,
  visit
} from './index.ts';

import { testFunctions } from './functions/test-functions.ts';

const tests = (tc: Test) => () => {
  switch (testType(tc)) {
    case 'syntax-error':
      describe('syntax error', () => {
        it('MessageFormat(string)', () => {
          expect(() => new MessageFormat(undefined, tc.src)).toThrow(
            MessageSyntaxError
          );
        });
        it('parseCST(string)', () => {
          const cst = parseCST(tc.src);
          const error = cst.errors[0];
          expect(error).toBeInstanceOf(MessageSyntaxError);
          expect(error).not.toBeInstanceOf(MessageDataModelError);
        });
      });
      break;

    case 'data-model-error':
      describe('data model error', () => {
        it('MessageFormat(string)', () => {
          expect(() => new MessageFormat(undefined, tc.src)).toThrow(
            MessageSyntaxError
          );
        });
        it('parseCST(string)', () => {
          const cst = parseCST(tc.src);
          const onError: any = fn();
          try {
            const msg = messageFromCST(cst);
            validate(msg, onError);
          } catch (error) {
            onError(error);
          }
          expect(onError).toHaveBeenCalledTimes(1);
        });
      });
      break;

    default:
      it('format', () => {
        let errors: any[] = [];
        const mfOpt: MessageFormatOptions = { functions: testFunctions };
        if (tc.bidiIsolation) mfOpt.bidiIsolation = tc.bidiIsolation;
        const mf = new MessageFormat(tc.locale, tc.src, mfOpt);
        const msg = mf.format(tc.params, err => errors.push(err));
        if (typeof tc.exp === 'string') expect(msg).toBe(tc.exp);
        if (Array.isArray(tc.expErrors)) {
          expect(errors).toMatchObject(tc.expErrors);
        } else if (tc.expErrors) {
          expect(errors).not.toHaveLength(0);
        } else {
          expect(errors).toHaveLength(0);
        }
        if (tc.expParts) {
          errors = [];
          const mp = mf.formatToParts(tc.params, err => errors.push(err));
          expect(mp).toMatchObject(tc.expParts);
          if (Array.isArray(tc.expErrors)) {
            expect(errors).toMatchObject(tc.expErrors);
          } else if (tc.expErrors) {
            expect(errors).not.toHaveLength(0);
          } else {
            expect(errors).toHaveLength(0);
          }
        }
      });

      it('parser comparison', () => {
        const msg1 = parseMessage(tc.src);

        const msg2 = messageFromCST(parseCST(tc.src));
        delete msg2[cst];
        visit(msg2, {
          node(node) {
            delete node[cst];
          }
        });

        expect(msg2).toEqual(msg1);
      });

      it('stringify CST', () => {
        const cst = parseCST(tc.src);
        expect(cst.errors).toHaveLength(0);
        const cst2 = parseCST(stringifyCST(cst));
        stripCST(cst);
        stripCST(cst2);
        expect(cst2).toEqual(cst);
      });

      it('stringify data model', () => {
        const msg = parseMessage(tc.src);
        const msg2 = parseMessage(stringifyMessage(msg));
        expect(msg2).toEqual(msg);
      });
  }
};

for (const scenario of testScenarios('test/messageformat-wg/test/tests')) {
  describe(scenario.scenario, () => {
    for (const tc of testCases(scenario)) {
      (tc.only ? describe.only : describe)(testName(tc), tests(tc));
    }
  });
}

function stripCST(cst: any) {
  if (cst) {
    if (Array.isArray(cst)) {
      for (const el of cst) stripCST(el);
    } else if (typeof cst === 'object') {
      for (const [key, value] of Object.entries(cst)) {
        if (key === 'start' || key === 'end') delete cst[key];
        else stripCST(value);
      }
    }
  }
}
