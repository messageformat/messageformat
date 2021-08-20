import type { SelectMessage } from '../data-model';

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
  value: string[];
  default: string;
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
  select: SelectMessage,
  res: ResolvedSelector[],
  key: string[]
) {
  const meta: FormattedSelectMeta = {};
  const { gcase, gender, plural } = detectGrammarSelectors(select);

  const cm = selectorMeta(res, key, gcase);
  if (cm) {
    meta.case = cm.orig;
    if (cm.fallback !== null) meta.caseFallback = cm.fallback;
  }

  const gm = selectorMeta(res, key, gender);
  if (gm) {
    meta.gender = gm.orig;
    if (gm.fallback !== null) meta.genderFallback = gm.fallback;
  }

  const k0 = res[plural]?.value[0];
  const pm =
    isNumeric(k0) || plurals.includes(k0)
      ? selectorMeta(res, key, plural)
      : null;
  if (pm) {
    meta.plural = pm.orig;
    if (pm.fallback !== null) meta.pluralFallback = pm.fallback;
  }

  return cm || gm || pm ? meta : null;
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

function selectorMeta(
  res: ResolvedSelector[],
  key: string[],
  idx: number
): { orig: string; fallback: string | null } | null {
  if (idx === -1) return null;
  const { value, default: def } = res[idx];
  const k = key[idx];
  if (value.includes(k)) {
    return { orig: k, fallback: null };
  } else {
    const orig = value.find(v => !isNumeric(v)) ?? value[0];
    return { orig, fallback: k ?? def };
  }
}
