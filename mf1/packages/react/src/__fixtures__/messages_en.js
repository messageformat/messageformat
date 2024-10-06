import { number, plural } from '@messageformat/runtime';
import { en } from '@messageformat/runtime/lib/cardinals';
export default {
  confirm: () => "Are you sure?",
  errors: {
    wrong_length: (d) => "Your message is the wrong length (should be " + plural(d.length, 0, en, { one: "1 character", other: number("en", d.length, 0) + " characters" }) + ")",
    equal_to: (d) => "The value must be equal to " + d.count
  }
}
