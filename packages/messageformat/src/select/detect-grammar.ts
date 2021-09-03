import type { SelectMessage } from '../data-model';
import { Formattable, FormattableNumber } from '../formattable';

const grammarCases = [
  'ablative',
  'absolutive',
  'accusative',
  'adessive',
  'adverbial',
  'agentive',
  'allative',
  'antessive',
  'benefactive',
  'causal',
  'comitative',
  'dative',
  'delative',
  'distributive',
  'elative',
  'ergative',
  'essive',
  'formal',
  'genitive',
  'illative',
  'inessive',
  'initiative',
  'instructive',
  'instrumental',
  'intransitive',
  'lative',
  'limitative',
  'locative',
  'nominative',
  'objective',
  'oblique',
  'ornative',
  'partitive',
  'privative',
  'possessive',
  'prepositional',
  'prolative',
  'sociative',
  'sublative',
  'superessive',
  'superlative',
  'temporal',
  'terminative',
  'translative',
  'vocative'
];

const genders = ['common', 'feminine', 'masculine', 'neuter'];

const plurals = ['zero', 'one', 'two', 'few', 'many'];

const isNumeric = (str: string) => Number.isFinite(Number(str));

type ResolvedSelector = {
  fmt: Formattable;
  def: string;
};

export interface FormattedSelectMeta {
  case?: string;
  caseFallback?: string;
  gender?: string;
  genderFallback?: string;
  plural?: string;
  pluralFallback?: string;
}

export function getFormattedSelectMeta(
  locales: string[],
  selectMsg: SelectMessage,
  key: string[],
  sel: ResolvedSelector[],
  fallback: boolean[]
) {
  let hasMeta = false;
  const meta: FormattedSelectMeta = {};
  const { gcase, gender, plural } = detectGrammarSelectors(selectMsg);

  if (gcase !== -1) {
    hasMeta = true;
    if (fallback[gcase]) {
      const { fmt, def } = sel[gcase];
      meta.case = String(fmt.value);
      meta.caseFallback = def;
    } else {
      meta.case = key[gcase];
    }
  }

  if (gender !== -1) {
    hasMeta = true;
    if (fallback[gender]) {
      const { fmt, def } = sel[gender];
      meta.gender = String(fmt.value);
      meta.genderFallback = def;
    } else {
      meta.gender = key[gender];
    }
  }

  if (plural !== -1) {
    const { fmt, def } = sel[plural];
    if (fmt instanceof FormattableNumber) {
      hasMeta = true;
      if (fallback[plural]) {
        meta.plural = fmt.getPluralCategory(locales);
        meta.pluralFallback = def;
      } else {
        meta.plural = key[plural];
      }
    }
  }

  return hasMeta ? meta : null;
}

const enum GC {
  Case = 1,
  Gender,
  Plural,
  Other
}

/**
 * Duck-type selectors based on the keys used to match them.
 *
 * Detects grammatical cases, grammatical genders, and plural categories.
 *
 * @returns Indices of first matching selectors, or -1 for no match.
 */
function detectGrammarSelectors({ cases, select }: SelectMessage) {
  const defaults = select.map(s => s.default || 'other');

  const gc: (GC | null)[] = new Array(select.length).fill(null);
  for (const { key } of cases) {
    for (let i = 0; i < gc.length; ++i) {
      const c = gc[i];
      if (c === GC.Other) continue;

      const k = key[i];
      if (k === defaults[i]) continue;

      if (isNumeric(k) || plurals.includes(k)) {
        if (c !== GC.Plural) gc[i] = c ? GC.Other : GC.Plural;
      } else if (grammarCases.includes(k)) {
        if (c !== GC.Case) gc[i] = c ? GC.Other : GC.Case;
      } else if (genders.includes(k)) {
        if (c !== GC.Gender) gc[i] = c ? GC.Other : GC.Gender;
      } else {
        gc[i] = GC.Other;
      }
    }
  }

  return {
    gcase: gc.indexOf(GC.Case),
    gender: gc.indexOf(GC.Gender),
    plural: gc.indexOf(GC.Plural)
  };
}
