import { compileFluent } from '@messageformat/compiler';
import { source } from '@messageformat/test-utils';

import { fluentRuntime, MessageFormat } from './index';

describe('options', () => {
  test('formatters', () => {
    const src = source`
      var = { $var }
      func = { NUMBER($var, maximumFractionDigits: 1) }
    `;
    const res = compileFluent(src);

    const mf1 = new MessageFormat('en', { runtime: fluentRuntime }, res);
    expect(mf1.getMessage('var', { var: 12.34 })?.toString()).toBe('12.34');
    expect(mf1.getMessage('func', { var: 12.34 })?.toString()).toBe('12.3');

    const mf2 = new MessageFormat(
      'en',
      { elements: ['literal', 'variable'], runtime: fluentRuntime },
      res
    );
    expect(mf2.getMessage('var', { var: 12.34 })?.toString()).toBe('12.34');
    expect(() => mf2.getMessage('func', { var: 12.34 })?.toString()).toThrow(
      'Unsupported pattern element: function'
    );
  });
});
