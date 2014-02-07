var MessageFormat = {
  locale: {},
  check_d: function(d){
    if(!d){throw new Error("MessageFormat: No data passed to function.")}
  },
  num: function(x, key){
    if(isNaN(x)){throw new Error("MessageFormat: `"+key+"` isnt a number.")}
    return x;
  },
};
