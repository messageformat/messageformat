{
  var inPlural = false;
}

start = token*

token
  = argument / select / plural / function
  / '#' & { return inPlural; } { return { type: 'octothorpe' }; }
  / str:char+ { return str.join(''); }

argument = '{' _ arg:id _ '}' {
    return {
      type: 'argument',
      arg: arg
    };
  }

select = '{' _ arg:id _ ',' _ (m:'select' { if (options.strict) { inPlural = false; } return m; }) _ ',' _ cases:selectCase+ _ '}' {
    return {
      type: 'select',
      arg: arg,
      cases: cases
    };
  }

plural = '{' _ arg:id _ ',' _ type:(m:('plural'/'selectordinal') { inPlural = true; return m; } ) _ ',' _ offset:offset? cases:pluralCase+ _ '}' {
    var ls = ((type === 'selectordinal') ? options.ordinal : options.cardinal)
             || ['zero', 'one', 'two', 'few', 'many', 'other'];
    if (ls && ls.length) cases.forEach(function(c) {
      if (isNaN(c.key) && ls.indexOf(c.key) < 0) throw new Error(
        'Invalid key `' + c.key + '` for argument `' + arg + '`.' +
        ' Valid ' + type + ' keys for this locale are `' + ls.join('`, `') +
        '`, and explicit keys like `=0`.');
    });
    inPlural = false;
    return {
      type: type,
      arg: arg,
      offset: offset || 0,
      cases: cases
    };
  }

function = '{' _ arg:id _ ',' _ key:functionKey _ param:functionParam? '}' {
    return {
      type: 'function',
      arg: arg,
      key: key,
      param: param
    };
  }

// not Pattern_Syntax or Pattern_White_Space
id = $([^\u0009-\u000d \u0085\u200e\u200f\u2028\u2029\u0021-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u007e\u00a1-\u00a7\u00a9\u00ab\u00ac\u00ae\u00b0\u00b1\u00b6\u00bb\u00bf\u00d7\u00f7\u2010-\u2027\u2030-\u203e\u2041-\u2053\u2055-\u205e\u2190-\u245f\u2500-\u2775\u2794-\u2bff\u2e00-\u2e7f\u3001-\u3003\u3008-\u3020\u3030\ufd3e\ufd3f\ufe45\ufe46]+)

selectCase = _ key:id _ tokens:caseTokens { return { key: key, tokens: tokens }; }

pluralCase = _ key:pluralKey _ tokens:caseTokens { return { key: key, tokens: tokens }; }

caseTokens = '{' (_ & '{')? tokens:token* _ '}' { return tokens; }

offset = _ 'offset' _ ':' _ d:digits _ { return d; }

pluralKey
  = id
  / '=' d:digits { return d; }

functionKey =
  ! 'select'
  ! 'plural'
  ! 'selectordinal'
  key:id & { return key.toLowerCase() === key && !/^\d/.test(key) } {
    if (options.strict) { inPlural = false; }
    return key;
  }

functionParam
  = _ ',' tokens:token* & { return !options.strict } { return { tokens: tokens } }
  / _ ',' parts:strictFunctionParamPart* { return { tokens: [parts.join('')] } }

strictFunctionParamPart
  = p:[^'{}]+ { return p.join('') }
  / doubleapos
  / "'" quoted:inapos "'" { return quoted }
  / '{' p:strictFunctionParamPart* '}' { return '{' + p.join('') + '}' }

doubleapos = "''" { return "'"; }

inapos = doubleapos / str:[^']+ { return str.join(''); }

quotedCurly
  = "'{"str:inapos*"'" { return '\u007B'+str.join(''); }
  / "'}"str:inapos*"'" { return '\u007D'+str.join(''); }

quoted
  = quotedCurly
  / quotedOcto:(("'#"str:inapos*"'" { return "#"+str.join(''); }) & { return inPlural; }) { return quotedOcto[0]; }
  / "'"

char
  = doubleapos
  / quoted
  / octo:'#' & { return !inPlural; } { return octo; }
  / [^{}#\0-\x08\x0e-\x1f\x7f]

digits = $([0-9]+)

// Pattern_White_Space
_ = $([\u0009-\u000d \u0085\u200e\u200f\u2028\u2029]*)
