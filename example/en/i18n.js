(function(G){G['i18n']={lc:{"en":function(n){return n===1?"one":"other"}},
c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
v:function(d,k){i18n.c(d,k);return d[k]},
p:function(d,k,o,l,p){i18n.c(d,k);return d[k] in p?p[d[k]]:(k=i18n.lc[l](d[k]-o),k in p?p[k]:p.other)},
s:function(d,k,p){i18n.c(d,k);return d[k] in p?p[d[k]]:p.other}}
i18n["colors"] = {
"red":function(d){return "red"},
"blue":function(d){return "blue"},
"green":function(d){return "green"}}
i18n["sub/folder/plural"] = {
"test":function(d){return "Your "+i18n.p(d,"NUM",0,"en",{"one":"message","other":"messages"})+" go here."}}
})(this);