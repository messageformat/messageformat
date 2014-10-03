(function(G){var _n=function(v,o){if(isNaN(v))throw new Error("'"+v+"' isn't a number.");return v-(o||0)},
_p=function(v,o,l,p,s){return v in p?p[v]:(k=l(v-o,s),k in p?p[k]:p.other)},
_s=function(v,p){return v in p?p[v]:p.other},
pf={"en":function(n,ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].substr(-1), n100 = t0 && s[0].substr(-2);
  if (ord) return (n10 == 1 && n100 != 11) ? 'one'
      : (n10 == 2 && n100 != 12) ? 'two'
      : (n10 == 3 && n100 != 13) ? 'few'
      : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}},
fmt={};
G["i18n"]={"colors":{
"red":function(d){return "red"},
"blue":function(d){return "blue"},
"green":function(d){return "green"}},
"sub/folder/plural":{
"test":function(d){return "Your "+_p(d["NUM"],0,pf["en"],{"one":"message goes","other":"messages go"})+" here."}}}
})(this);
