var expect = require('expect.js');
var PluralFormat = require('./../pluralformat');

describe( "PluralFormat", function () {

  describe( "Public API", function () {

    it("should exist", function () {
      expect( PluralFormat ).to.be.ok();
    });

    it("should have static helper functions/objects", function () {
      expect( PluralFormat.Utils ).to.be.an( 'object' );
      expect( PluralFormat.locale ).to.be.an( 'object' );
      expect( PluralFormat.SafeString ).to.be.a( 'function' );
    });

    it("should be a constructor", function () {
      var pf = new PluralFormat( 'en' );
      expect( pf ).to.be.a( PluralFormat );
    });

    it("should have instance functions", function () {
      var pf = new PluralFormat( 'en' );
      expect( pf.parse ).to.be.a( 'function' );
      expect( pf.precompile ).to.be.a( 'function' );
      expect( pf.compile ).to.be.a( 'function' );
    });

  });

  describe( "Complex parsing", function () {
    it("can parse complex strings", function () {
      var input = "" +
      "{PERSON} added {PLURAL_NUM_PEOPLE, plural, offset:1" +
      "     =0 {no one}"+
      "     =1 {just {GENDER, select, male {him} female {her} other{them}}self}"+
      "    one {{GENDER, select, male {him} female {her} other{them}}self and one other person}"+
      "  other {{GENDER, select, male {him} female {her} other{them}}self and # other people}"+
      "} to {GENDER, select,"+
      "   male {his}"+
      " female {her}"+
      "  other {their}"+
      "} group.";

      var pf = new PluralFormat( 'en' );
      var pf_func = pf.compile( input );
      var data = {
          PLURAL_NUM_PEOPLE : 1,
          PERSON : "Allie Sexton",
          GENDER: "female"
      };

      expect( pf_func( data ) ).to.eql('Allie Sexton added just herself to her group.');
    });

  });

});
