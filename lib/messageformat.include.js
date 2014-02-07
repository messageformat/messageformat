var _MF = {
  check_d: function(d){
    if(!d){throw new Error("MessageFormat: No data passed to function.")}
  },
  num: function(d,k,o){
    if(isNaN(d[k])){throw new Error("MessageFormat: `"+k+"` isnt a number.")}
    return d[k]-(o||0);
  },
  val: function(d,k){
    _MF.check_d(d);
    return d[k];
  },
  plu: function(d,k,o,l,p){
    _MF.check_d(d);
    var v = p[ d[k] ] || p[ MessageFormat.locale[l](d[k]-o) ] || p.other;
    return "string" == typeof v ? v : v(d);
  },
  sel: function(d,k,p){
    _MF.check_d(d);
    var v = p[ d[k] ] || p.other;
    return "string" == typeof v ? v : v(d);
  }
};
