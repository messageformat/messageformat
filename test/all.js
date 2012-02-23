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

    it("should default to 'en' when no locale is passed into the constructor", function () {
      expect((new PluralFormat()).locale).to.be( 'en' );
    });

  });

  describe( "Simple Parsing", function () {

    describe( "Replacement", function () {

      it("should accept string only input", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse( 'This is a string' ).program.statements[0].val ).to.be( 'This is a string' );
        expect( pf.parse( '☺☺☺☺' ).program.statements[0].val ).to.be( '☺☺☺☺' );
        expect( pf.parse( 'This is \n a string' ).program.statements[0].val ).to.be( 'This is \n a string' );
        expect( pf.parse( '中国话不用彁字。' ).program.statements[0].val ).to.be( '中国话不用彁字。' );
      });

      it("should allow you to escape { and } characters", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse("\\{test").program.statements[0].val ).to.eql( '{test' );
        expect( pf.parse("test\\}").program.statements[0].val ).to.eql( 'test}' );
        expect( pf.parse("\\{test\\}").program.statements[0].val ).to.eql( '{test}' );
      });

      it("should accept only a variable", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('{test}') ).to.be.an( 'object' );
      });

      it("should not care about white space in a variable", function () {
        var pf = new PluralFormat( 'en' );
        var targetStr = JSON.stringify( pf.parse('{test}') );
        expect( JSON.stringify( pf.parse('{test }') ) ).to.eql( targetStr );
        expect( JSON.stringify( pf.parse('{ test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( pf.parse('{test  }') ) ).to.eql( targetStr );
        expect( JSON.stringify( pf.parse('{  test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( pf.parse('{test}') ) ).to.eql( targetStr );
      });

      it("should maintain exact strings - not affected by variables", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('x{test}').program.statements[0].val ).to.be( 'x' );
        expect( pf.parse('\n{test}').program.statements[0].val ).to.be( '\n' );
        expect( pf.parse(' {test}').program.statements[0].val ).to.be( ' ' );
        expect( pf.parse('x { test}').program.statements[0].val ).to.be( 'x ' );
        expect( pf.parse('x{test} x ').program.statements[1].statements[1].val ).to.be( ' x ' );
        expect( pf.parse('x\n{test}\n').program.statements[0].val ).to.be( 'x\n' );
        expect( pf.parse('x\n{test}\n').program.statements[1].statements[1].val ).to.be( '\n' );
      });

      it("should handle extended character literals", function () {
        var pf = new PluralFormat( 'en' );
        expect( pf.parse('☺{test}').program.statements[0].val ).to.be( '☺' );
        expect( pf.parse('中{test}中国话不用彁字。').program.statements[1].statements[1].val ).to.be( '中国话不用彁字。' );
      });
    });

    describe( "Selects", function () {

      it("should accept a select statement based on a variable", function () {
        var pf = new PluralFormat( 'en' );
       // expect( pf.parse('') );
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

      it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function () {
        var pf = new PluralFormat( 'en' );
        expect(function(){ pf.parse('{☺}'); }).to.throwError();
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
