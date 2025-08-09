import { MessageFormat } from '../index.ts';
import { percent } from './percent.ts';

for (const [src, value, options] of [
  ['{$n :percent}', 1, {}],
  ['.input {$n :number} {{{$n :percent}}}', 0.42, {}],
  ['.input {$n :integer} {{{$n :percent}}}', 42, {}],
  ['.input {$n :percent} {{{$n :percent}}}', 0.01, {}],
  ['{$n :percent}', 0.12345678, {}],
  [
    '{$n :percent maximumFractionDigits=1}',
    0.12345678,
    { maximumFractionDigits: 1 }
  ],
  ['{$n :percent minimumFractionDigits=1}', 0.12, { minimumFractionDigits: 1 }],
  [
    '{$n :percent minimumSignificantDigits=1}',
    0.12,
    { minimumSignificantDigits: 1 }
  ]
] as const) {
  test(src, () => {
    const mf = new MessageFormat('en', src, {
      bidiIsolation: 'none',
      functions: { percent }
    });
    const nf = new Intl.NumberFormat('en', { style: 'percent', ...options });
    expect(mf.format({ n: value })).toEqual(nf.format(value));
    expect(mf.formatToParts({ n: value })).toMatchObject([
      { parts: nf.formatToParts(value) }
    ]);
  });
}
