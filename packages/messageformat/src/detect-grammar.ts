import type { Select, SelectKey } from './data-model';
import type { ResolvedSelector } from './format-message';

const cases = [
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

export interface FormattedSelectMeta {
  case?: SelectKey;
  caseFallback?: SelectKey;
  gender?: SelectKey;
  genderFallback?: SelectKey;
  plural?: SelectKey;
  pluralFallback?: SelectKey;
}

export function getFormattedSelectMeta(
  select: Select,
  res: ResolvedSelector[],
  key: SelectKey[]
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

  const pm =
    typeof res[plural]?.value !== 'string'
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
export function detectGrammarSelectors(select: Select) {
  const defaults = select.select.map(s => s.default || 'other');

  const gc: (GC | null)[] = new Array(select.select.length).fill(null);
  for (const { key } of select.cases) {
    for (let i = 0; i < gc.length; ++i) {
      const c = gc[i];
      if (c === GC.Other) continue;

      const k = key[i];
      if (k === defaults[i]) continue;

      if (typeof k === 'number' || plurals.includes(k)) {
        if (c !== GC.Plural) gc[i] = c ? GC.Other : GC.Plural;
      } else if (cases.includes(k)) {
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
  key: SelectKey[],
  idx: number
): { orig: SelectKey; fallback: SelectKey | null } | null {
  if (idx === -1) return null;
  const { value, default: def } = res[idx];
  const k = key[idx];
  if (k === value || (Array.isArray(value) && value.includes(k))) {
    return { orig: k, fallback: null };
  } else {
    const orig = Array.isArray(value)
      ? value.find(v => typeof v === 'string') ?? value[0]
      : value;
    return { orig, fallback: k ?? def };
  }
}
