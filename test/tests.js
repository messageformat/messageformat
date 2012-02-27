describe( "MessageFormat", function () {

  describe( "Public API", function () {

    it("should exist", function () {
      expect( MessageFormat ).to.be.ok();
    });

    it("should have static helper functions/objects", function () {
      expect( MessageFormat.Utils ).to.be.an( 'object' );
      expect( MessageFormat.locale ).to.be.an( 'object' );
      expect( MessageFormat.SafeString ).to.be.a( 'function' );
    });

    it("should be a constructor", function () {
      var mf = new MessageFormat( 'en' );
      expect( mf ).to.be.a( MessageFormat );
    });

    it("should have instance functions", function () {
      var mf = new MessageFormat( 'en' );
      expect( mf.parse ).to.be.a( 'function' );
      expect( mf.precompile ).to.be.a( 'function' );
      expect( mf.compile ).to.be.a( 'function' );
    });

    it("should bail on non-existing locales", function () {
      expect(function(){ var a = new MessageFormat( 'lawlz' ); }).to.throwError();
    });

    it("should default to 'en' when no locale is passed into the constructor", function () {
      expect((new MessageFormat()).locale).to.be( 'en' );
    });

  });

  describe( "Parsing", function () {

    describe( "Replacement", function () {

      it("should accept string only input", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse( 'This is a string' ).program.statements[0].val ).to.be( 'This is a string' );
        expect( mf.parse( '☺☺☺☺' ).program.statements[0].val ).to.be( '☺☺☺☺' );
        expect( mf.parse( 'This is \n a string' ).program.statements[0].val ).to.be( 'This is \n a string' );
        expect( mf.parse( '中国话不用彁字。' ).program.statements[0].val ).to.be( '中国话不用彁字。' );
      });

      it("should allow you to escape { and } characters", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse("\\{test").program.statements[0].val ).to.eql( '{test' );
        expect( mf.parse("test\\}").program.statements[0].val ).to.eql( 'test}' );
        expect( mf.parse("\\{test\\}").program.statements[0].val ).to.eql( '{test}' );
      });

      it("should gracefully handle quotes (since it ends up in a JS String)", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('This is a dbl quote: "').program.statements[0].val ).to.eql( 'This is a dbl quote: "' );
        expect( mf.parse("This is a single quote: '").program.statements[0].val ).to.eql( "This is a single quote: '" );
      });

      it("should accept only a variable", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('{test}') ).to.be.an( 'object' );
      });

      it("should not care about white space in a variable", function () {
        var mf = new MessageFormat( 'en' );
        var targetStr = JSON.stringify( mf.parse('{test}') );
        expect( JSON.stringify( mf.parse('{test }') ) ).to.eql( targetStr );
        expect( JSON.stringify( mf.parse('{ test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( mf.parse('{test  }') ) ).to.eql( targetStr );
        expect( JSON.stringify( mf.parse('{  test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( mf.parse('{test}') ) ).to.eql( targetStr );
      });

      it("should maintain exact strings - not affected by variables", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('x{test}').program.statements[0].val ).to.be( 'x' );
        expect( mf.parse('\n{test}').program.statements[0].val ).to.be( '\n' );
        expect( mf.parse(' {test}').program.statements[0].val ).to.be( ' ' );
        expect( mf.parse('x { test}').program.statements[0].val ).to.be( 'x ' );
        expect( mf.parse('x{test} x ').program.statements[1].statements[1].val ).to.be( ' x ' );
        expect( mf.parse('x\n{test}\n').program.statements[0].val ).to.be( 'x\n' );
        expect( mf.parse('x\n{test}\n').program.statements[1].statements[1].val ).to.be( '\n' );
      });

      it("should handle extended character literals", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('☺{test}').program.statements[0].val ).to.be( '☺' );
        expect( mf.parse('中{test}中国话不用彁字。').program.statements[1].statements[1].val ).to.be( '中国话不用彁字。' );
      });

      it("shouldn't matter if it has html or something in it", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('<div class="test">content: {TEST}</div>').program.statements[0].val ).to.be( '<div class="test">content: ' );
        expect( mf.parse('<div class="test">content: {TEST}</div>').program.statements[1].statements[0].argumentIndex ).to.be( 'TEST' );
        expect( mf.parse('<div class="test">content: {TEST}</div>').program.statements[1].statements[1].val ).to.be( '</div>' );
      });

      it("should allow you to use extension keywords for plural formats everywhere except where they go", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('select select, ').program.statements[0].val ).to.eql( 'select select, ' );
        expect( mf.parse('select offset, offset:1 ').program.statements[0].val ).to.eql( 'select offset, offset:1 ' );
        expect( mf.parse('one other, =1 ').program.statements[0].val ).to.eql( 'one other, =1 ' );
        expect( mf.parse('one {select} ').program.statements[1].statements[0].argumentIndex ).to.eql( 'select' );
        expect( mf.parse('one {plural} ').program.statements[1].statements[0].argumentIndex ).to.eql( 'plural' );
      });
    });

    describe( "Selects", function () {

      it("should accept a select statement based on a variable", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ mf.parse('{VAR, select, key{a} other{b}}'); }).to.not.throwError();
      });

      it("should be very whitespace agnostic", function (){
        var mf = new MessageFormat( 'en' );
        var firstRes = JSON.stringify(mf.parse('{VAR, select, key{a} other{b}}'));
        expect( JSON.stringify(mf.parse('{VAR,select,key{a}other{b}}')) ).to.eql( firstRes );
        expect( JSON.stringify(mf.parse('{    VAR   ,    select   ,    key      {a}   other    {b}    }')) ).to.eql( firstRes );
        expect( JSON.stringify(mf.parse('{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }')) ).to.eql( firstRes );
        expect( JSON.stringify(mf.parse('{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }')) ).to.eql( firstRes );
      });

      it("should allow you to use MessageFormat extension keywords other places, including in select keys", function () {
        var mf = new MessageFormat( 'en' );
        // use `select` as a select key
        expect( mf.parse( 'x {TEST, select, select{a} other{b} }' )
                    .program.statements[1].statements[0]
                    .elementFormat.val.pluralForms[0].key
              ).to.eql( 'select' );
        // use `offset` as a key (since it goes here in a `plural` case)
        expect( mf.parse( 'x {TEST, select, offset{a} other{b} }' )
                    .program.statements[1].statements[0]
                    .elementFormat.val.pluralForms[0].key
              ).to.eql( 'offset' );
        // use the exact variable name as a key name
        expect( mf.parse( 'x {TEST, select, TEST{a} other{b} }' )
                    .program.statements[1].statements[0]
                    .elementFormat.val.pluralForms[0].key
              ).to.eql( 'TEST' );
      });

      it("should be case-sensitive (select keyword is lowercase, everything else doesn't matter", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ var a = mf.parse('{TEST, Select, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = mf.parse('{TEST, SELECT, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = mf.parse('{TEST, selecT, a{a} other{b}}'); }).to.throwError();
      });

    });

    describe( "Plurals", function () {

      it("should accept a variable, no offset, and plural keys", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ var a = mf.parse('{NUM, plural, one{1} other{2}}'); }).to.not.throwError();
      });

      it("should accept exact values with `=` prefixes", function () {
        var mf = new MessageFormat( 'en' );
        expect(
          mf.parse('{NUM, plural, =0{e1} other{2}}').program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 0 );
        expect(
          mf.parse('{NUM, plural, =1{e1} other{2}}').program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 1 );
        expect(
          mf.parse('{NUM, plural, =2{e1} other{2}}').program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 2 );
        expect(
          mf.parse('{NUM, plural, =1{e1} other{2}}').program.statements[0].statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( "other" );
      });

      it("should accept the 6 official keywords", function () {
        var mf = new MessageFormat( 'en' );
        // 'zero', 'one', 'two', 'few', 'many' and 'other'
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          mf.parse( '{NUM, plural,   zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          mf.parse( '{NUM, plural,zero    {0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          mf.parse( '{NUM, plural,  \nzero\n   {0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( 'one' );
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[2].key
        ).to.eql( 'two' );
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[3].key
        ).to.eql( 'few' );
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[4].key
        ).to.eql( 'many' );
        expect(
          mf.parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).program.statements[0].statements[0].elementFormat.val.pluralForms[5].key
        ).to.eql( 'other' );
      });

      it("should be gracious with whitespace", function () {
        var mf = new MessageFormat( 'en' );
        var firstRes = JSON.stringify( mf.parse('{NUM, plural, one{1} other{2}}') );
        expect(JSON.stringify( mf.parse('{ NUM, plural, one{1} other{2} }') )).to.eql( firstRes );
        expect(JSON.stringify( mf.parse('{NUM,plural,one{1}other{2}}') )).to.eql( firstRes );
        expect(JSON.stringify( mf.parse('{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}') )).to.eql( firstRes );
        expect(JSON.stringify( mf.parse('{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}') )).to.eql( firstRes );
      });

      it("should take an offset", function () {
        var mf = new MessageFormat( 'en' );
        expect( mf.parse('{NUM, plural, offset:4 other{a}}') ).to.be.ok();
        expect( mf.parse('{NUM, plural, offset : 4 other{a}}') ).to.be.ok();
        expect( mf.parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}') ).to.be.ok();
        // technically this is parsable since js identifiers don't start with numbers
        expect( mf.parse('{NUM,plural,offset:4other{a}}') ).to.be.ok();

        expect(
          mf.parse('{NUM, plural, offset:4 other{a}}').program.statements[0].statements[0].elementFormat.val.offset
        ).to.eql( 4 );
        expect(
          mf.parse('{NUM,plural,offset:4other{a}}').program.statements[0].statements[0].elementFormat.val.offset
        ).to.eql( 4 );

      });

    });

    describe( "Nested/Recursive blocks", function () {

      it("should allow a select statement inside of a select statement", function () {
        var mf = new MessageFormat( 'en' );

        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(
          mf.parse('{NUM1, select, other{{NUM2, select, other{a}}}}')
            .program
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].val
        ).to.eql( 'a' );

        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(
         mf.parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}') 
            .program
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].val
        ).to.eql( 'b' );

        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(
         mf.parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}')
            .program
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].val
        ).to.eql( 'c' );
      });

      it("should allow nested plural statements - with and without offsets", function () {
        var mf = new MessageFormat( 'en' );

        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .program
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].val
        ).to.eql('c');
      });

      it("should allow nested plural and select statements - with and without offsets", function () {
        var mf = new MessageFormat( 'en' );

        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = mf.parse('{NUM1, select, other{{NUM2, select, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          mf.parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .program
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].statements[0].elementFormat.val.pluralForms[0].val
              .statements[0].val
        ).to.eql('c');
      });

    });

    describe( "Errors", function () {

      it("should catch mismatched/invalid bracket situations", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ mf.parse('}'); }).to.throwError();
        expect(function(){ mf.parse('{'); }).to.throwError();
        expect(function(){ mf.parse('{{X}'); }).to.throwError();
        expect(function(){ mf.parse('{}'); }).to.throwError();
        expect(function(){ mf.parse('{}{'); }).to.throwError();
        expect(function(){ mf.parse('{X}{'); }).to.throwError();
        expect(function(){ mf.parse('}{}'); }).to.throwError();
        expect(function(){ mf.parse('}{X}'); }).to.throwError();
        expect(function(){ mf.parse('{}}'); }).to.throwError();
        expect(function(){ mf.parse('{X}}'); }).to.throwError();
        expect(function(){ mf.parse('{{X}}'); }).to.throwError();
        expect(function(){ mf.parse(); }).to.throwError();
        // Technically an empty string is valid.
        expect(function(){ mf.parse(''); }).to.not.throwError();
      });

      it("should not allow an offset for SELECTs", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ mf.parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}'); }).to.throwError();
      });

      it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function () {
        var mf = new MessageFormat( 'en' );
        expect(function(){ mf.parse('{☺}'); }).to.throwError();
      });

      it("should throw errors on negative offsets", function () {
        expect(function(){ mf.parse('{NUM, plural, offset:-4 other{a}}'); }).to.throwError();
      });

    });
  });

  describe( "Message Formatting", function () {

    it("has a precompile function", function () {
      var mf = new MessageFormat( 'en' );
      expect(mf.precompile).to.be.a('function');
    });

    it("precompiles to a string", function () {
      var mf = new MessageFormat( 'en' );

      expect(mf.precompile(mf.parse("test"))).to.be.a('string');
    });

    it("has a compile function", function () {
      var mf = new MessageFormat( 'en' );
      expect(mf.compile).to.be.a('function');
    });

    it("compiles to a function", function () {
      var mf = new MessageFormat( 'en' );

      expect(mf.compile("test")).to.be.a('function');
    });

    it("can output a non-formatted string", function () {
      var mf = new MessageFormat( 'en' );

      expect((mf.compile("This is a string."))()).to.eql("This is a string.");
    });

    it("can substitute named variables", function () {
      var mf = new MessageFormat( 'en' );

      expect((mf.compile("The var is {VAR}."))({"VAR":5})).to.eql("The var is 5.");
    });

    it("can substitute shorthand variables", function () {
      var mf = new MessageFormat( 'en' );

      expect((mf.compile("{VAR, select, other{The var is #.}}"))({"VAR":5})).to.eql("The var is 5.");
    });

    it("obeys plural functions", function () {
      var mf = new MessageFormat( 'fake', function ( x ) {
        return 'few';
      });

      expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:0})).to.be( "res: wasfew" );
      expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:1})).to.be( "res: wasfew" );
      expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:2})).to.be( "res: wasfew" );
      expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({val:3})).to.be( "res: wasfew" );
      expect((mf.compile("res: {val, plural, few{wasfew} other{failed}}"))({})).to.be( "res: wasfew" );
    });

    it("throws an error when no `other` option is found - plurals", function () {
      var mf = new MessageFormat( 'en' );
      expect(function(){ var x = mf.compile("{X, plural, someoption{a}}"); }).to.throwError();
    });

    it("throws an error when no `other` option is found - selects", function () {
      var mf = new MessageFormat( 'en' );
      expect(function(){ var x = mf.compile("{X, select, someoption{a}}"); }).to.throwError();
    });

    it("can parse complex, real-world strings", function () {
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

      var mf = new MessageFormat( 'en' );
      var mf_func = mf.compile( input );

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 0,
          PERSON : "Allie Sexton",
          GENDER: "female"
      }) ).to.eql('Allie Sexton added no one to her group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 1,
          PERSON : "Allie Sexton",
          GENDER: "female"
      }) ).to.eql('Allie Sexton added just herself to her group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 2,
          PERSON : "Allie Sexton",
          GENDER: "female"
      }) ).to.eql('Allie Sexton added herself and one other person to her group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 3,
          PERSON : "Allie Sexton",
          GENDER: "female"
      }) ).to.eql('Allie Sexton added herself and 2 other people to her group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 0,
          PERSON : "Alex Sexton",
          GENDER: "male"
      }) ).to.eql('Alex Sexton added no one to his group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 1,
          PERSON : "Alex Sexton",
          GENDER: "male"
      }) ).to.eql('Alex Sexton added just himself to his group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 2,
          PERSON : "Alex Sexton",
          GENDER: "male"
      }) ).to.eql('Alex Sexton added himself and one other person to his group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 3,
          PERSON : "Alex Sexton",
          GENDER: "male"
      }) ).to.eql('Alex Sexton added himself and 2 other people to his group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 0,
          PERSON : "Al Sexton"
      }) ).to.eql('Al Sexton added no one to their group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 1,
          PERSON : "Al Sexton"
      }) ).to.eql('Al Sexton added just themself to their group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 2,
          PERSON : "Al Sexton"
      }) ).to.eql('Al Sexton added themself and one other person to their group.');

      expect( mf_func({
          PLURAL_NUM_PEOPLE : 3,
          PERSON : "Al Sexton"
      }) ).to.eql('Al Sexton added themself and 2 other people to their group.');

    });

  });

});
