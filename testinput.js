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
var PluralFormat = require('./messageformat').PluralFormat;
var fmtr = new PluralFormat();

console.log( fmtr.applyPattern("{0, plural, one{{0, number, C''''est #,##0.0#  fichier}} other {Ce sont # fichiers}}") );
*/
