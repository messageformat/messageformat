start
  = messageFormatPattern:messageFormatPattern {
      return { type: "program", program: messageFormatPattern };
    }

messageFormatPattern
  = s1:string inner:(messageFormatElement string)* {
      var st = [];
      if (s1 && s1.val) st.push(s1);
      for (var i = 0; i < inner.length; i++) {
        st.push(inner[i][0]);
        if (inner[i][1].val !== "") st.push(inner[i][1]);
      }
      return { type: 'messageFormatPattern', statements: st };
    }

messageFormatElement
  = '{' _ argIdx:id efmt:(',' elementFormat)? _ '}' {
      var res = {
        type: "messageFormatElement",
        argumentIndex: argIdx
      };
      if (efmt && efmt.length) {
        res.elementFormat = efmt[1];
      } else {
        res.output = true;
      }
      return res;
    }

elementFormat
  = _ t:"plural" _ ',' _ s:pluralFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:"selectordinal" _ ',' _ s:selectFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:"select" _ ',' _ s:selectFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:id p:argStylePattern* {
      return { type: "elementFormat", key: t, val: p };
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
  = _ "offset" _ ":" _ d:digits _ { return d; }

selectFormatPattern
  = pf:pluralForms* { return { type: "selectFormatPattern", pluralForms: pf }; }

pluralForms
  = _ k:stringKey _ "{" _ mfp:messageFormatPattern _ "}" {
      return { type: "pluralForms", key: k, val: mfp };
    }

stringKey
  = i:id { return i; }
  / "=" d:digits { return d; }

argStylePattern
  = _ "," _ p:id _ { return p; }

string
  = s:(chars/whitespace)* { return { type: "string", val: s.join('') }; }

// This is a subset to keep code size down
// More or less, it has to be a single word
// that doesn't contain punctuation, etc
id "identifier"
  = _ s:$([0-9a-zA-Z$_]s2:[^ \t\n\r,.+={}]*) _ { return s; }

chars
  = chars:char+ { return chars.join(''); }

char
  = x:[^{}\\\0-\x1F\x7f \t\n\r] { return x; }
  / "\\#" { return "\\#"; }
  / "\\{" { return "\u007B"; }
  / "\\}" { return "\u007D"; }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

digits
  = ds:[0-9]+ {
    //the number might start with 0 but must not be interpreted as an octal number
    //Hence, the base is passed to parseInt explicitely
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
