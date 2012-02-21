var mparse = require('./message_parser'); 

console.log( JSON.stringify(
  mparse.parse(
   
  //  "   space 中国话不用彁字。 goes lol test {VAR_HERE, select, 1 { 1innerstr # ... # } } realend"
 "I see {NUM_PEOPLE,plural,offset:1"+
          "=0{no one at all}" +
          "=1{{WHO}}" +
          "one{{WHO} and one other person}" +
          "other {{WHO} and 中国话不用彁字。 # other people}} " +
  "in {PLACE}."

),null, '  '));

/*
{{#_ "i18n_key" "OBJECT" object "COUNT" object_count }}
  I have {OBJGENDER, plural
         one {a {object} }
         other {COUNT {{object}s  }
  .
{{/_}}
*/

