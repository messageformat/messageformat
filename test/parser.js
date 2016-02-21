/*global describe,it,expect,MessageFormat */
describe("Parser", function() {

    describe( "Replacement", function () {

      it("should accept string only input", function () {
        expect( MessageFormat._parse( 'This is a string' ).statements[0].val ).to.be( 'This is a string' );
        expect( MessageFormat._parse( '☺☺☺☺' ).statements[0].val ).to.be( '☺☺☺☺' );
        expect( MessageFormat._parse( 'This is \n a string' ).statements[0].val ).to.be( 'This is \n a string' );
        expect( MessageFormat._parse( '中国话不用彁字。' ).statements[0].val ).to.be( '中国话不用彁字。' );
        expect( MessageFormat._parse( ' \t leading whitspace' ).statements[0].val ).to.be( ' \t leading whitspace' );
        expect( MessageFormat._parse( 'trailing whitespace   \n  ' ).statements[0].val ).to.be( 'trailing whitespace   \n  ' );
      });

      it("should allow you to escape { and } characters", function () {
        expect( MessageFormat._parse("\\{test").statements[0].val ).to.eql( '{test' );
        expect( MessageFormat._parse("test\\}").statements[0].val ).to.eql( 'test}' );
        expect( MessageFormat._parse("\\{test\\}").statements[0].val ).to.eql( '{test}' );
      });

      it("should gracefully handle quotes (since it ends up in a JS String)", function () {
        expect( MessageFormat._parse('This is a dbl quote: "').statements[0].val ).to.eql( 'This is a dbl quote: "' );
        expect( MessageFormat._parse("This is a single quote: '").statements[0].val ).to.eql( "This is a single quote: '" );
      });

      it("should accept only a variable", function () {
        expect( MessageFormat._parse('{test}') ).to.be.an( 'object' );
        expect( MessageFormat._parse('{0}') ).to.be.an( 'object' );
      });

      it("should not care about white space in a variable", function () {
        var targetStr = JSON.stringify( MessageFormat._parse('{test}') );
        expect( JSON.stringify( MessageFormat._parse('{test }') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{ test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{test  }') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{  test}') ) ).to.eql( targetStr );
        expect( JSON.stringify( MessageFormat._parse('{test}') ) ).to.eql( targetStr );
      });

      it("should maintain exact strings - not affected by variables", function () {
        expect( MessageFormat._parse('x{test}').statements[0].val ).to.be( 'x' );
        expect( MessageFormat._parse('\n{test}').statements[0].val ).to.be( '\n' );
        expect( MessageFormat._parse(' {test}').statements[0].val ).to.be( ' ' );
        expect( MessageFormat._parse('x { test}').statements[0].val ).to.be( 'x ' );
        expect( MessageFormat._parse('x{test} x ').statements[2].val ).to.be( ' x ' );
        expect( MessageFormat._parse('x\n{test}\n').statements[0].val ).to.be( 'x\n' );
        expect( MessageFormat._parse('x\n{test}\n').statements[2].val ).to.be( '\n' );
      });

      it("should handle extended character literals", function () {
        expect( MessageFormat._parse('☺{test}').statements[0].val ).to.be( '☺' );
        expect( MessageFormat._parse('中{test}中国话不用彁字。').statements[2].val ).to.be( '中国话不用彁字。' );
      });

      it("shouldn't matter if it has html or something in it", function () {
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[0].val ).to.be( '<div class="test">content: ' );
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[1].argumentIndex ).to.be( 'TEST' );
        expect( MessageFormat._parse('<div class="test">content: {TEST}</div>').statements[2].val ).to.be( '</div>' );
      });

      it("should allow you to use extension keywords for plural formats everywhere except where they go", function () {
        expect( MessageFormat._parse('select select, ').statements[0].val ).to.eql( 'select select, ' );
        expect( MessageFormat._parse('select offset, offset:1 ').statements[0].val ).to.eql( 'select offset, offset:1 ' );
        expect( MessageFormat._parse('one other, =1 ').statements[0].val ).to.eql( 'one other, =1 ' );
        expect( MessageFormat._parse('one {select} ').statements[1].argumentIndex ).to.eql( 'select' );
        expect( MessageFormat._parse('one {plural} ').statements[1].argumentIndex ).to.eql( 'plural' );
      });
    });

    describe( "Selects", function () {

      it("should accept a select statement based on a variable", function () {
        expect(function(){ MessageFormat._parse('{VAR, select, key{a} other{b}}'); }).to.not.throwError();
      });

      it("should be very whitespace agnostic", function (){
        var firstRes = JSON.stringify(MessageFormat._parse('{VAR, select, key{a} other{b}}'));
        expect( JSON.stringify(MessageFormat._parse('{VAR,select,key{a}other{b}}')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{    VAR   ,    select   ,    key      {a}   other    {b}    }')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{ \n   VAR  \n , \n   select  \n\n , \n \n  key \n    \n {a}  \n other \n   {b} \n  \n }')) ).to.eql( firstRes );
        expect( JSON.stringify(MessageFormat._parse('{ \t  VAR  \n , \n\t\r  select  \n\t , \t \n  key \n    \t {a}  \n other \t   {b} \t  \t }')) ).to.eql( firstRes );
      });

      it("should allow you to use MessageFormat extension keywords other places, including in select keys", function () {
        // use `select` as a select key
        expect(MessageFormat._parse('x {TEST, select, select{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'select' );
        // use `offset` as a key (since it goes here in a `plural` case)
        expect(MessageFormat._parse('x {TEST, select, offset{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'offset' );
        // use the exact variable name as a key name
        expect(MessageFormat._parse('x {TEST, select, TEST{a} other{b} }')
          .statements[1].elementFormat.val.pluralForms[0].key
        ).to.eql( 'TEST' );
      });

      it("should be case-sensitive (select keyword is lowercase, everything else doesn't matter)", function () {
        expect(function(){ var a = MessageFormat._parse('{TEST, Select, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = MessageFormat._parse('{TEST, SELECT, a{a} other{b}}'); }).to.throwError();
        expect(function(){ var a = MessageFormat._parse('{TEST, selecT, a{a} other{b}}'); }).to.throwError();
      });

      it("should not accept keys with `=` prefixes", function () {
        expect(function(){ var a = MessageFormat._parse('{TEST, select, =0{a} other{b}}'); }).to.throwError();
      });

    });

    describe( "Plurals", function () {

      it("should accept a variable, no offset, and plural keys", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM, plural, one{1} other{2}}'); }).to.not.throwError();
      });

      it("should accept exact values with `=` prefixes", function () {
        expect(
          MessageFormat._parse('{NUM, plural, =0{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 0 );
        expect(
          MessageFormat._parse('{NUM, plural, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 1 );
        expect(
          MessageFormat._parse('{NUM, plural, =2{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 2 );
        expect(
          MessageFormat._parse('{NUM, plural, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( "other" );
      });

      it("should accept the 6 official keywords", function () {
        // 'zero', 'one', 'two', 'few', 'many' and 'other'
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,   zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,zero    {0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural,  \nzero\n   {0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 'zero' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( 'one' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[2].key
        ).to.eql( 'two' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[3].key
        ).to.eql( 'few' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[4].key
        ).to.eql( 'many' );
        expect(
          MessageFormat._parse( '{NUM, plural, zero{0} one{1} two{2} few{5} many{100} other{101}}' ).statements[0].elementFormat.val.pluralForms[5].key
        ).to.eql( 'other' );
      });

      it("should be gracious with whitespace", function () {
        var firstRes = JSON.stringify( MessageFormat._parse('{NUM, plural, one{1} other{2}}') );
        expect(JSON.stringify( MessageFormat._parse('{ NUM, plural, one{1} other{2} }') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{NUM,plural,one{1}other{2}}') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{\nNUM,   \nplural,\n   one\n\n{1}\n other {2}\n\n\n}') )).to.eql( firstRes );
        expect(JSON.stringify( MessageFormat._parse('{\tNUM\t,\t\t\r plural\t\n, \tone\n{1}    other\t\n{2}\n\n\n}') )).to.eql( firstRes );
      });

      it("should take an offset", function () {
        expect( MessageFormat._parse('{NUM, plural, offset:4 other{a}}') ).to.be.ok();
        expect( MessageFormat._parse('{NUM, plural, offset : 4 other{a}}') ).to.be.ok();
        expect( MessageFormat._parse('{NUM, plural, offset\n\t\r : \t\n\r4 other{a}}') ).to.be.ok();
        // technically this is parsable since js identifiers don't start with numbers
        expect( MessageFormat._parse('{NUM,plural,offset:4other{a}}') ).to.be.ok();

        expect(
          MessageFormat._parse('{NUM, plural, offset:4 other{a}}').statements[0].elementFormat.val.offset
        ).to.eql( 4 );
        expect(
          MessageFormat._parse('{NUM,plural,offset:4other{a}}').statements[0].elementFormat.val.offset
        ).to.eql( 4 );

      });

    });

    describe( "Ordinals", function () {

      it("should accept a variable and ordinal keys", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM, selectordinal, one{1} other{2}}'); }).to.not.throwError();
      });

      it("should accept exact values with `=` prefixes", function () {
        expect(
          MessageFormat._parse('{NUM, selectordinal, =0{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 0 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 1 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =2{e1} other{2}}').statements[0].elementFormat.val.pluralForms[0].key
        ).to.eql( 2 );
        expect(
          MessageFormat._parse('{NUM, selectordinal, =1{e1} other{2}}').statements[0].elementFormat.val.pluralForms[1].key
        ).to.eql( "other" );
      });

    });

    describe( "Nested/Recursive blocks", function () {

      it("should allow a select statement inside of a select statement", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{a}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'a' );

        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'b' );

        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(
          MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, select, other{{NUM4, select, other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql( 'c' );
      });

      it("should allow nested plural statements - with and without offsets", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql('c');
      });

      it("should allow nested plural and select statements - with and without offsets", function () {
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, select, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{a}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, select, other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, select, other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{b}}}}}}'); }).to.not.throwError();

        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, offset:1 other{{NUM4, plural, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, offset:1 other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, select, other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, plural, other{{NUM2, plural, offset:1 other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        expect(function(){ var a = MessageFormat._parse('{NUM1, select, other{{NUM2, select, other{{NUM3, plural, offset:1 other{{NUM4, plural, offset:1 other{c}}}}}}}}'); }).to.not.throwError();
        // ok we get it, it's recursive.

        expect(
          MessageFormat._parse('{NUM1, selectordinal, other{{NUM2, plural, offset:1 other{{NUM3, selectordinal, other{{NUM4, plural, offset:1 other{c}}}}}}}}')
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].elementFormat.val.pluralForms[0].val
            .statements[0].val
        ).to.eql('c');
      });

    });

    describe( "Errors", function () {

      it("should catch mismatched/invalid bracket situations", function () {
        expect(function(){ MessageFormat._parse('}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{{X}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{X}{'); }).to.throwError();
        expect(function(){ MessageFormat._parse('}{}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('}{X}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{X}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse('{{X}}'); }).to.throwError();
        expect(function(){ MessageFormat._parse(); }).to.throwError();
        // Technically an empty string is valid.
        expect(function(){ MessageFormat._parse(''); }).to.not.throwError();
      });

      it("should not allow an offset for SELECTs", function () {
        expect(function(){ MessageFormat._parse('{NUM, select, offset:1 test { 1 } test2 { 2 }}'); }).to.throwError();
      });

      it("should allow an offset for SELECTORDINALs", function () {
        expect(function(){ MessageFormat._parse('{NUM, selectordinal, offset:1 test { 1 } test2 { 2 }}'); }).to.not.throwError();
      });

      it("shouldn't allow characters in variables that aren't valid JavaScript identifiers", function () {
        expect(function(){ MessageFormat._parse('{☺}'); }).to.throwError();
      });

      it("should allow positional variables", function () {
        expect(function(){ MessageFormat._parse('{0}'); }).to.not.throwError();
      });

      it("should throw errors on negative offsets", function () {
        expect(function(){ MessageFormat._parse('{NUM, plural, offset:-4 other{a}}'); }).to.throwError();
      });

    });
});
