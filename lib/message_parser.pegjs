start
  = messageFormatPattern:messageFormatPattern { return { type: "program", program: messageFormatPattern }; }

messageFormatPattern
  = s1:string inner:(messageFormatPatternRight)* {
    var st = [];
    if ( s1 && s1.val ) {
      st.push( s1 );
    }
    for( var i in inner ){
      if ( inner.hasOwnProperty( i ) ) {
        st.push( inner[ i ] );
      }
    }
    return { type: 'messageFormatPattern', statements: st };
  }

messageFormatPatternRight
  = '{' _ mfe:messageFormatElement _ '}' s1:string {
    var res = [];
    if ( mfe ) {
      res.push(mfe);
    }
    if ( s1 && s1.val ) {
      res.push( s1 );
    }
    return { type: "messageFormatPatternRight", statements : res };
  }

messageFormatElement
  = argIdx:id efmt:(',' elementFormat)? {
    var res = { 
      type: "messageFormatElement",
      argumentIndex: argIdx
    };
    if ( efmt && efmt.length ) {
      res.elementFormat = efmt[1];
    }
    else {
      res.output = true;
    }
    return res;
  }

elementFormat
  = _ t:"plural" _ ',' _ s:pluralStyle _ {
    return {
      type : "elementFormat",
      key  : t,
      val  : s.val
    };
  }
  / _ t:"select" _ ',' _ s:selectStyle _ {
    return {
      type : "elementFormat",
      key  : t,
      val  : s.val
    };
  }

pluralStyle
  = pfp:pluralFormatPattern {
    return { type: "pluralStyle", val: pfp };
  }

selectStyle
  = sfp:selectFormatPattern {
    return { type: "selectStyle", val: sfp };
  }

pluralFormatPattern
  = op:offsetPattern? pf:(pluralForms)* {
    var res = {
      type: "pluralFormatPattern",
      pluralForms: pf
    };
    if ( op ) {
      res.offset = op;
    }
    else {
      res.offset = 0;
    }
    return res;
  }

offsetPattern
  = _ "offset" _ ":" _ d:digits _ {
    return d;
  }

selectFormatPattern
  = pf:pluralForms* {
    return {
      type: "selectFormatPattern",
      pluralForms: pf
    };
  }

pluralForms
  = _ k:stringKey _ "{" _ mfp:messageFormatPattern _ "}" {
    return {
      type: "pluralForms",
      key: k,
      val: mfp
    };
  }

stringKey
  = i:id {
    return i;
  }
  / "=" d:digits {
    return d;
  }


string
  = ws:_ s:(_ chars _)* {
    var tmp = [];
    for( var i = 0; i < s.length; ++i ) {
      for( var j = 0; j < s[ i ].length; ++j ) {
        tmp.push(s[i][j]);
      }
    }
    return {
      type: "string",
      val: ws + tmp.join('')
    };
  }

// This is a subset to keep code size down
// More or less, it has to be a single word
// that doesn't contain punctuation, etc
id
  = _ s1:[0-9a-zA-Z$_]s2:[^ \t\n\r,.+={}]* _ {
    return s1 + (s2 ? s2.join('') : '');
  }

chars
  = chars:char+ { return chars.join(''); }

char
  = x:[^{}\\\0-\x1F\x7f \t\n\r] {
    return x;
  }
  / "\\#" {
    return "\\#";
  }
  / "\\{" {
    return "\u007B";
  }
  / "\\}" {
    return "\u007D";
  }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
  }

digits
  = ds:[0-9]+ {
    return parseInt((ds.join('')), 10);
  }

hexDigit
  = [0-9a-fA-F]

_ "whitespace"
  = w:whitespace* { return w.join(''); }

// Whitespace is undefined in the original JSON grammar, so I assume a simple
// conventional definition consistent with ECMA-262, 5th ed.
whitespace
  = [ \t\n\r]
