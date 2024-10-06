import { number, plural } from '@messageformat/runtime';
import { fi } from '@messageformat/runtime/lib/cardinals';
export default {
  confirm: () => "Oletko varma?",
  errors: {
    wrong_length: (d) => "Viestisi on väärän pituinen (pitäisi olla " + plural(d.length, 0, fi, { one: "1 merkki", other: number("fi", d.length, 0) + " merkkiä" }) + ")"
  }
}
