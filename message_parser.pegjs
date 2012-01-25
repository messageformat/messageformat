start
  = messageFormatPattern:messageFormatPattern { return { type: "program", program: messageFormatPattern }; }

messageFormatPattern
  = s1:string inner:(messageFormatPatternRight)* {
    var st = [ s1 ];
    for( var i in inner ){
      if ( inner.hasOwnProperty( i ) ) {
        st.push( inner[ i ] );
      }
    }
    return { type: 'MFP', statements: st };
  }

messageFormatPatternRight
  = '{' _ mfe:messageFormatElement _ '}' s1:string {
    return { type: "MFPRight", statements : [ mfe, s1 ] };
  }

messageFormatElement
  = argIdx:id efmt:(',' elementFormat)? {
    var res = { 
      type: "MFE",
      argIdx: argIdx
    };
    if ( efmt && efmt.length ) {
      res.efmt = efmt[1];
    }
    return res;
  }

elementFormat
  = _ t:"plural" ',' s:pluralStyle {
    return {
      type : "EFMT",
      key : t,
      val : s.val
    };
  }
  / _ t:"select" ',' s:selectStyle {
    return {
      type : "EFMT",
      key : t,
      val : s.val
    };
  }

pluralStyle
  = pfp:pluralFormatPattern {
    return { type: "PS", val: pfp };
  }

selectStyle
  = sfp:selectFormatPattern {
    return { type: "SS", val: sfp };
  }

pluralFormatPattern
  = op:offsetPattern? pf:(pluralForms)* {
    return {
      type: "PFP",
      offsetPattern: op,
      pluralForms: pf
    };
  }

offsetPattern
  = _ "offset" _ ":" _ d:digits _ {
    return {
      type: "OP",
      offset: d
    };
  }

selectFormatPattern
  = pf:pluralForms* {
    return {
      type: "SFP",
      pluralForms: pf
    };
  }

pluralForms
  = _ k:stringKey _ "{" _ mfp:messageFormatPattern _ "}" {
    return {
      type: "PF",
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

// TODO:: pull in a cross browser map.
string
  = s:(_ chars _)* { return { type: "string", val: s.map(function(x){ return x.join(''); }).join('') }; }

// This is a subset to keep code size down
// More or less, it has to be a single word
// that doesn't contain punctuation, etc
id
  = _ s1:[a-zA-Z$_]s2:[^ \t\n\r,.+={}]* _ {
    return s1 + (s2 ? s2.join('') : '');
  }

chars
  = chars:char+ { return chars.join(''); }

char
  = [^{}\\\0-\x1F\x7f \t\n\r]
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

digits
  = ds:[0-9]+ {
    return parseInt((""+ds), 10);
  }

hexDigit
  = [0-9a-fA-F]

_ "whitespace"
  = w:whitespace* { return w.join(''); }

// Whitespace is undefined in the original JSON grammar, so I assume a simple
// conventional definition consistent with ECMA-262, 5th ed.
whitespace
  = [ \t\n\r]
