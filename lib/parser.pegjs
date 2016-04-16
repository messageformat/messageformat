start = token* 

token
  = '{' _ arg:id _ '}' {
      return {
        type: 'argument',
        arg: arg
      };
    }
  / '{' _ arg:id _ ',' _ 'select' _ ',' _ cases:selectCase+ _ '}' {
      return {
        type: 'select',
        arg: arg,
        cases: cases
      };
    }
  / '{' _ arg:id _ ',' _ type:('plural'/'selectordinal') _ ',' _ offset:offset? cases:pluralCase+ _ '}' {
      return {
        type: type,
        arg: arg,
        offset: offset || 0,
        cases: cases
      };
    }
  / '{' _ arg:id _ ',' _ key:id _ params:functionParams* '}' {
      return {
        type: 'function',
        arg: arg,
        key: key,
        params: params
      };
    }
  / '#' { return { type: 'octothorpe' }; }
  / str:char+ { return str.join(''); }

id = $([0-9a-zA-Z$_][^ \t\n\r,.+={}]*)

selectCase = _ key:id _ tokens:caseTokens { return { key: key, tokens: tokens }; }

pluralCase = _ key:pluralKey _ tokens:caseTokens { return { key: key, tokens: tokens }; }

caseTokens = '{' (_ & '{')? tokens:token* _ '}' { return tokens; }

offset = _ 'offset' _ ':' _ d:digits _ { return d; }

pluralKey = id / '=' d:digits { return d; }

functionParams = _ ',' _ p:id _ { return p; }

char
  = [^{}#\\\0-\x08\x0e-\x1f\x7f]
  / '\\\\' { return '\\'; }
  / '\\#' { return '#'; }
  / '\\{' { return '\u007B'; }
  / '\\}' { return '\u007D'; }
  / '\\u' h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt('0x' + h1 + h2 + h3 + h4));
    }

digits = $([0-9]+)

hexDigit = [0-9a-fA-F]

_ = $([ \t\n\r]*)
