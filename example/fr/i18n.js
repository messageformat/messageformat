(function(){ window.i18n || (window.i18n = {}) 
var MessageFormat = { locale: {} };
MessageFormat.locale.fr=function(n){return n===0||n==1?"one":"other"}
window.i18n.get=function(n,k,d){
var m=this[n],f=function(k,d){return typeof m[k]=="function"?m[k](d):k in m?m[k]:k};
return !m?null
:typeof k=="undefined"?f
:typeof d=="undefined"?typeof m[k]=="function"?m[k]:function(){return m[k]}
:f(k,d)}
var
c=function(d){if(!d)throw new Error("MessageFormat: No data passed to function.")},
n=function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: `"+k+"` isnt a number.");return d[k]-(o||0)},
v=function(d,k){c(d);return d[k]},
p=function(d,k,o,l,p){c(d);return d[k] in p?p[d[k]]:(k=MessageFormat.locale[l](d[k]-o),k in p?p[k]:p.other)},
s=function(d,k,p){c(d);return d[k] in p?p[d[k]]:p.other};
window.i18n["colors"] = {
"red":"rouge",
"blue":"bleu",
"green":"vert"}
window.i18n["sub/folder/plural"] = {
"test":function(d){return p(d,"NUM",0,"fr",{"one":"Votre message se trouve","other":"Vos messages se trouvent"})+" ici."}}
})();