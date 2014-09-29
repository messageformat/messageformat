(function(G){var f={"lc":{"fr":function(n,ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}},
"c":function (d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
"n":function (d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
"v":function (f,d,k){f.c(d,k);return d[k]},
"p":function (f,d,k,o,l,p,s){f.c(d,k);return d[k] in p?p[d[k]]:(k=f.lc[l](d[k]-o,s),k in p?p[k]:p.other)},
"s":function (f,d,k,p){f.c(d,k);return d[k] in p?p[d[k]]:p.other}};
G["i18n"]={"colors":{
"red":function(d){return "rouge"},
"blue":function(d){return "bleu"},
"green":function(d){return "vert"}},
"sub/folder/plural":{
"test":function(d){return f.p(f,d,"NUM",0,"fr",{"one":"Votre message se trouve","other":"Vos messages se trouvent"})+" ici."}}}
})(this);
