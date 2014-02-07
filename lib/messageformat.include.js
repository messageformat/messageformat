var _MF = {
c:function(d){if(!d)throw new Error("MessageFormat: No data passed to function.")},
n:function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: `"+k+"` isnt a number.");return d[k]-(o||0)},
v:function(d,k){_MF.c(d);return d[k]},
p:function(d,k,o,l,p){_MF.c(d);var v=p[d[k]]||p[MessageFormat.locale[l](d[k]-o)]||p.other;return"string"==typeof v?v:v(d)},
s:function(d,k,p){_MF.c(d);var v=p[d[k]]||p.other;return"string"==typeof v?v:v(d)}
};
