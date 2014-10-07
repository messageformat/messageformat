(function(G){var
_n=function(v,o){if(isNaN(v))throw new Error("'"+v+"' isn't a number.");return v-(o||0)},
_p=function(v,o,l,p,s){return v in p?p[v]:(v=l(v-o,s),v in p?p[v]:p.other)},
_s=function(v,p){return v in p?p[v]:p.other},
pf={"fr":function(n,ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}},
fmt={};

G["i18n"] = {
colors:{
red:function(d){return "rouge"},
blue:function(d){return "bleu"},
green:function(d){return "vert"}},
"sub/folder/plural":{
test:function(d){return _p(d["NUM"],0,pf["fr"],{one:"Votre message se trouve",other:"Vos messages se trouvent"})+" ici."}}}
})(this);
