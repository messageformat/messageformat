import { compileFluentResource } from '@messageformat/compiler';
import { source } from '@messageformat/test-utils';

describe('options', () => {
  test('formatters', () => {
    const src = source`
      var = { $var }
      func = { NUMBER($var, maximumFractionDigits: 1) }
    `;
    const res = compileFluentResource(src, 'en');

    expect(res.get('var')?.resolveMessage({ var: 12.34 })?.toString()).toBe(
      '12.34'
    );
    expect(res.get('func')?.resolveMessage({ var: 12.34 })?.toString()).toBe(
      '12.3'
    );
  });
});
