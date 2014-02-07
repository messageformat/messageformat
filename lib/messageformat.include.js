var MessageFormat = {
  locale: {},
  check_d: function(d){
    if(!d){throw new Error("MessageFormat: No data passed to function.")}
  },
  num: function(d,k,o){
    if(isNaN(d[k])){throw new Error("MessageFormat: `"+k+"` isnt a number.")}
    return d[k]-(o||0);
  },
  val: function(d,k){
    return d[k];
  },
  plural: function(d,k,o,l,p){
    return (p[d[k]]||p[MessageFormat.locale[l](d[k]-o)]||p["other"])(d);
  },
  select: function(d,k,p){
    return (p[d[k]]||p["other"])(d);
  }
};
