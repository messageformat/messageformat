import type { SelectMessage, Variant } from '../data-model';
import type { Meta } from '../message-value';

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

const plurals = ['zero', 'one', 'two', 'few', 'many', 'other'];

const isNumeric = (str: string) => Number.isFinite(Number(str));

export function getFormattedSelectMeta(
  selectMsg: SelectMessage,
  keys: Variant['keys']
): Meta | undefined {
  const det = detectGrammarSelectors(selectMsg);

  let gcase: string | undefined;
  if (det.case !== -1) {
    const key = keys[det.case];
    if (key.type !== '*') gcase = key.value;
  }

  let gender: string | undefined;
  if (det.gender !== -1) {
    const key = keys[det.gender];
    if (key.type !== '*') gender = key.value;
  }

  let plural: string | undefined;
  if (det.plural !== -1) {
    const key = keys[det.plural];
    if (key.type !== '*') plural = key.value;
  }

  if (gcase || gender || plural) {
    const meta: Meta = {};
    if (gcase) meta.case = gcase;
    if (gender) meta.gender = gender;
    if (plural) meta.plural = plural;
    return meta;
  }

  return undefined;
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
function detectGrammarSelectors({ selectors, variants }: SelectMessage) {
  const gc: (GC | null)[] = new Array(selectors.length).fill(null);
  for (const { keys } of variants) {
    for (let i = 0; i < gc.length; ++i) {
      const c = gc[i];
      if (c === GC.Other) continue;

      const key = keys[i];
      if (key.type === '*') continue;

      if (isNumeric(key.value) || plurals.includes(key.value)) {
        if (c !== GC.Plural) gc[i] = c ? GC.Other : GC.Plural;
      } else if (grammarCases.includes(key.value)) {
        if (c !== GC.Case) gc[i] = c ? GC.Other : GC.Case;
      } else if (genders.includes(key.value)) {
        if (c !== GC.Gender) gc[i] = c ? GC.Other : GC.Gender;
      } else {
        gc[i] = GC.Other;
      }
    }
  }

  return {
    case: gc.indexOf(GC.Case),
    gender: gc.indexOf(GC.Gender),
    plural: gc.indexOf(GC.Plural)
  };
}
