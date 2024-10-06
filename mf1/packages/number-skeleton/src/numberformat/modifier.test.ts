import { getNumberFormatModifier } from './modifier';

test('empty skeleton', () => {
  const m = getNumberFormatModifier({});
  expect(m(1)).toBe(1);
});

test('scale', () => {
  const scale = Math.random();
  const m = getNumberFormatModifier({ scale });
  expect(m(1)).toBe(scale);
});

test('percent', () => {
  const m = getNumberFormatModifier({ unit: { style: 'percent' } });
  expect(m(1)).toBe(0.01);
});

test('percent scale/1000', () => {
  const m = getNumberFormatModifier({
    scale: 1000,
    unit: { style: 'percent' }
  });
  expect(m(1)).toBe(10);
});
