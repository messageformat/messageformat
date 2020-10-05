import { Skeleton } from '../types/skeleton';
import { getNumberFormatLocales } from './locales';

const latin: Skeleton = { numberingSystem: 'latn' };

describe('string locale', () => {
  test('no numbering system', () => {
    const lc = getNumberFormatLocales('en', {});
    expect(lc).toEqual(['en']);
  });

  test('no u tag', () => {
    const lc = getNumberFormatLocales('en', latin);
    expect(lc).toEqual(['en-u-nu-latn', 'en']);
  });

  test('with u tag', () => {
    const lc = getNumberFormatLocales('en-GB-u-ca-islamic', latin);
    expect(lc).toEqual(['en-GB-u-ca-islamic-nu-latn', 'en-GB-u-ca-islamic']);
  });
});

describe('array locale', () => {
  test('no numbering system', () => {
    const input = ['fi, en'];
    const lc = getNumberFormatLocales(input, {});
    expect(lc).toBe(input);
  });

  test('no u tag', () => {
    const lc = getNumberFormatLocales(['fi', 'en'], latin);
    expect(lc).toEqual(['fi-u-nu-latn', 'en-u-nu-latn', 'fi', 'en']);
  });

  test('with u tags', () => {
    const lc = getNumberFormatLocales(
      ['fi-FI-u-ca-islamic', 'en-GB-u-ca-islamic'],
      latin
    );
    expect(lc).toEqual([
      'fi-FI-u-ca-islamic-nu-latn',
      'en-GB-u-ca-islamic-nu-latn',
      'fi-FI-u-ca-islamic',
      'en-GB-u-ca-islamic'
    ]);
  });
});
