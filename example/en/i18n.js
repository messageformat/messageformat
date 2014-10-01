(function(G){var f={"lc":{"en":function anonymous(n) {
var s = String(n).split('.'), v0 = !s[1];
if (n == 1 && v0) return 'one';
return 'other';
}},
"c":function (d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
"n":function (d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
"v":function (f,d,k){f.c(d,k);return d[k]},
"p":function (f,d,k,o,l,p){f.c(d,k);return d[k] in p?p[d[k]]:(k=f.lc[l](d[k]-o),k in p?p[k]:p.other)},
"s":function (f,d,k,p){f.c(d,k);return d[k] in p?p[d[k]]:p.other}};
G["i18n"]={"colors":{
"red":function(d){return "red"},
"blue":function(d){return "blue"},
"green":function(d){return "green"}},
"sub/folder/plural":{
"test":function(d){return "Your "+f.p(f,d,"NUM",0,"en",{"one":"message goes","other":"messages go"})+" here."}}}
})(this);
