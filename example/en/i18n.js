(function(G){var f={"lc":{"en":function(n,ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].substr(-1), n100 = t0 && s[0].substr(-2);
  if (ord) return (n10 == 1 && n100 != 11) ? 'one'
      : (n10 == 2 && n100 != 12) ? 'two'
      : (n10 == 3 && n100 != 13) ? 'few'
      : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}},
"c":function (d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
"n":function (d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
"v":function (f,d,k){f.c(d,k);return d[k]},
"p":function (f,d,k,o,l,p,s){f.c(d,k);return d[k] in p?p[d[k]]:(k=f.lc[l](d[k]-o,s),k in p?p[k]:p.other)},
"s":function (f,d,k,p){f.c(d,k);return d[k] in p?p[d[k]]:p.other}};
G["i18n"]={"colors":{
"red":function(d){return "red"},
"blue":function(d){return "blue"},
"green":function(d){return "green"}},
"sub/folder/plural":{
"test":function(d){return "Your "+f.p(f,d,"NUM",0,"en",{"one":"message goes","other":"messages go"})+" here."}}}
})(this);
