import {
  Test,
  testCases,
  testName,
  testScenarios,
  testType
} from '~/test/utils/mfwg-test-utils.js';

import {
  MessageDataModelError,
  MessageFormat,
  MessageFormatOptions,
  MessageSyntaxError,
  cst,
  messageFromCST,
  parseCST,
  parseMessage,
  stringifyCST,
  stringifyMessage,
  validate,
  visit
} from './index.js';

import { DraftFunctions } from './functions/index.js';
import { TestFunctions } from './functions/test-functions.js';

const tests = (tc: Test) => () => {
  const mfOpt: MessageFormatOptions = {
    functions: { ...DraftFunctions, ...TestFunctions }
  };
  switch (testType(tc)) {
    case 'syntax-error':
      describe('syntax error', () => {
        test('MessageFormat(string)', () => {
          expect(() => new MessageFormat(undefined, tc.src, mfOpt)).toThrow(
            MessageSyntaxError
          );
        });
        test('parseCST(string)', () => {
          const cst = parseCST(tc.src);
          const error = cst.errors[0];
          expect(error).toBeInstanceOf(MessageSyntaxError);
          expect(error).not.toBeInstanceOf(MessageDataModelError);
        });
      });
      break;

    case 'data-model-error':
      describe('data model error', () => {
        test('MessageFormat(string)', () => {
          expect(() => new MessageFormat(undefined, tc.src, mfOpt)).toThrow(
            MessageSyntaxError
          );
        });
        test('parseCST(string)', () => {
          const cst = parseCST(tc.src);
          const onError = jest.fn();
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
      test('format', () => {
        let errors: any[] = [];
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

      test('parser comparison', () => {
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

      test('stringify CST', () => {
        const cst = parseCST(tc.src);
        expect(cst.errors).toHaveLength(0);
        const cst2 = parseCST(stringifyCST(cst));
        stripCST(cst);
        stripCST(cst2);
        expect(cst2).toEqual(cst);
      });

      test('stringify data model', () => {
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
