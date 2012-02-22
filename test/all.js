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

    it("should bail on non-existing locales", function () {
      expect(function(){ var a = new PluralFormat( 'lawlz' ); }).to.throwError();
    });

  });

  describe( "Simple Parsing", function () {

    describe( "Basic Variables", function () {

      it("should accept only a variable", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('{test}') ).to.be.an( 'object' );
      });

      it("should not care about white space in a variable", function () {
        var pf = new PluralFormat( 'en' );
        expect( JSON.stringify( pf.parse('{test }') ) ).to.be( '{"type":"program","program":{"type":"messageFormatPattern","statements":[{"type":"messageFormatPatternRight","statements":[{"type":"messageFormatElement","argumentIndex":"test","output":true}]}]}}' );
        expect( JSON.stringify( pf.parse('{ test}') ) ).to.be( '{"type":"program","program":{"type":"messageFormatPattern","statements":[{"type":"messageFormatPatternRight","statements":[{"type":"messageFormatElement","argumentIndex":"test","output":true}]}]}}' );
        expect( JSON.stringify( pf.parse('{test  }') ) ).to.be( '{"type":"program","program":{"type":"messageFormatPattern","statements":[{"type":"messageFormatPatternRight","statements":[{"type":"messageFormatElement","argumentIndex":"test","output":true}]}]}}' );
        expect( JSON.stringify( pf.parse('{  test}') ) ).to.be( '{"type":"program","program":{"type":"messageFormatPattern","statements":[{"type":"messageFormatPatternRight","statements":[{"type":"messageFormatElement","argumentIndex":"test","output":true}]}]}}' );
        expect( JSON.stringify( pf.parse('{test}') ) ).to.be( '{"type":"program","program":{"type":"messageFormatPattern","statements":[{"type":"messageFormatPatternRight","statements":[{"type":"messageFormatElement","argumentIndex":"test","output":true}]}]}}' );
      });

      it("should maintain exact strings on either side of variables", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('x{test}').program.statements[0].val ).to.be( 'x' );
        expect( pf.parse('\n{test}').program.statements[0].val ).to.be( '\n' );
        expect( pf.parse(' {test}').program.statements[0].val ).to.be( ' ' );
        expect( pf.parse('x { test}').program.statements[0].val ).to.be( 'x ' );
        expect( pf.parse('x{test} x ').program.statements[1].statements[1].val ).to.be( ' x ' );
        expect( pf.parse('x\n{test}\n').program.statements[0].val ).to.be( 'x\n' );
        expect( pf.parse('x\n{test}\n').program.statements[1].statements[1].val ).to.be( '\n' );
      });
    });

    describe( "Selects", function () {

      it("should accept a select statement based on a variable", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('') );
      });

    });

    describe( "Parsing Errors", function () {

      it("should catch mismatched/invalid bracket situations", function () {
        var pf = new PluralFormat( 'en' );
        expect(function(){ pf.parse('}'); }).to.throwError();
        expect(function(){ pf.parse('{'); }).to.throwError();
        expect(function(){ pf.parse('{{X}'); }).to.throwError();
        expect(function(){ pf.parse('{}'); }).to.throwError();
        expect(function(){ pf.parse('{}{'); }).to.throwError();
        expect(function(){ pf.parse('{X}{'); }).to.throwError();
        expect(function(){ pf.parse('}{}'); }).to.throwError();
        expect(function(){ pf.parse('}{X}'); }).to.throwError();
        expect(function(){ pf.parse('{}}'); }).to.throwError();
        expect(function(){ pf.parse('{X}}'); }).to.throwError();
        expect(function(){ pf.parse('{{X}}'); }).to.throwError();
        expect(function(){ pf.parse(); }).to.throwError();
        // Technically an empty string is valid.
        expect(function(){ pf.parse(''); }).to.not.throwError();
      });

      it("should not allow an offset for SELECTs", function () {
        var pf = new PluralFormat( 'en' );
        expect(function(){ pf.parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}'); }).to.throwError();
      });

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
