import { Skeleton } from '../types/skeleton.js';

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
function round(x: number, precision: number) {
  const y = +x + precision / 2;
  return y - (y % +precision);
}

function getNumberFormatMultiplier({ scale, unit }: Skeleton) {
  const mult = scale ?? 1;
  if (unit?.style === 'percent') {
    return mult === 1 || mult === 100 ? 1 : mult * 0.01;
  }
  return mult;
}

/**
 * Determine a modifier for the input value to account for any `scale`,
 * `percent`, and `precision-increment` tokens in the skeleton.
 *
 * @internal
 * @remarks
 * With ICU NumberFormatter, the `percent` skeleton would style `25` as "25%".
 * To achieve the same with `Intl.NumberFormat`, the input value must be `0.25`.
 */
export function getNumberFormatModifier(skeleton: Skeleton) {
  const mult = getNumberFormatMultiplier(skeleton);
  const { precision } = skeleton;
  if (precision && precision.style === 'precision-increment') {
    return (n: number) => round(n, precision.increment) * mult;
  } else {
    return (n: number) => n * mult;
  }
}

/**
 * Returns a string of JavaScript source that evaluates to a modifier for the
 * input value to account for any `scale`, `percent`, and `precision-increment`
 * tokens in the skeleton.
 *
 * @internal
 * @remarks
 * With ICU NumberFormatter, the `percent` skeleton would style `25` as "25%".
 * To achieve the same with `Intl.NumberFormat`, the input value must be `0.25`.
 */
export function getNumberFormatModifierSource(skeleton: Skeleton) {
  const mult = getNumberFormatMultiplier(skeleton);
  const { precision } = skeleton;
  if (precision && precision.style === 'precision-increment') {
    // see round() above for source
    const setX = `+n + ${precision.increment / 2}`;
    let res = `x - (x % +${precision.increment})`;
    if (mult !== 1) res = `(${res}) * ${mult}`;
    return `function(n) { var x = ${setX}; return ${res}; }`;
  }
  return mult !== 1 ? `function(n) { return n * ${mult}; }` : null;
}
