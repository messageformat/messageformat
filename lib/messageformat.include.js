window.i18n.get = function(n, k, d) {
  var m = this[n], f = function(k, d) { return m[k] && m[k](d) || k; };
  return !m ? null
    : (typeof k == "undefined") ? f
    : (typeof d == "undefined") ? m[k]
    : f(k, d);
}
var
c=function(d){if(!d)throw new Error("MessageFormat: No data passed to function.")},
n=function(d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: `"+k+"` isnt a number.");return d[k]-(o||0)},
v=function(d,k){c(d);return d[k]},
p=function(d,k,o,l,p){c(d);return d[k] in p?p[d[k]]:(k=MessageFormat.locale[l](d[k]-o),k in p?p[k]:p.other)},
s=function(d,k,p){c(d);return d[k] in p?p[d[k]]:p.other};
