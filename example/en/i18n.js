(function(){ window.i18n || (window.i18n = {}) 
var MessageFormat = { locale: {} };
MessageFormat.locale.en=function(n){return n===1?"one":"other"}
var
c=function(d){if(!d)throw new Error("MessageFormat: No data passed to function.")},
n=function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: `"+k+"` isnt a number.");return d[k]-(o||0)},
v=function(d,k){c(d);return d[k]},
p=function(d,k,o,l,p){c(d);var v=p[d[k]]||p[MessageFormat.locale[l](d[k]-o)]||p.other;return"string"==typeof v?v:v(d)},
s=function(d,k,p){c(d);var v=p[d[k]]||p.other;return"string"==typeof v?v:v(d)};
window.i18n["colors"] = {}
window.i18n["colors"]["red"] = function(d){return "red"}
window.i18n["colors"]["blue"] = function(d){return "blue"}
window.i18n["colors"]["green"] = function(d){return "green"}
window.i18n["sub/folder/plural"] = {}
window.i18n["sub/folder/plural"]["test"] = function(d){return "Your "+p(d,"NUM",0,"en",{"one":"message","other":"messages"})+" go here."}
})();