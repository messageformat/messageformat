(function(G){G['i18n']={lc:{"fr":function(n){return n===0||n==1?"one":"other"}},
c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
v:function(d,k){i18n.c(d,k);return d[k]},
p:function(d,k,o,l,p){i18n.c(d,k);return d[k] in p?p[d[k]]:(k=i18n.lc[l](d[k]-o),k in p?p[k]:p.other)},
s:function(d,k,p){i18n.c(d,k);return d[k] in p?p[d[k]]:p.other}}
i18n["colors"] = {
"red":function(d){return "rouge"},
"blue":function(d){return "bleu"},
"green":function(d){return "vert"}}
i18n["sub/folder/plural"] = {
"test":function(d){return i18n.p(d,"NUM",0,"fr",{"one":"Votre message se trouve","other":"Vos messages se trouvent"})+" ici."}}
})(this);