(function(G) {
var number = function (value, offset) {
  if (isNaN(value)) throw new Error("'" + value + "' isn't a number.");
  return value - (offset || 0);
};
var plural = function (value, offset, lcfunc, data, isOrdinal) {
  if (value in data) return data[value];
  if (offset) value -= offset;
  var key = lcfunc(value, isOrdinal);
  if (key in data) return data[key];
  return data.other;
};
var select = function (value, data) {
  if (value in data) return data[value];
  return data.other
};
var pluralFuncs = {
  fr: function(n,ord) {
    if (ord) return (n == 1) ? 'one' : 'other';
    return (n >= 0 && n < 2) ? 'one' : 'other';
  }
};
var fmt = {};

G.i18n = {
  colors: {
    red: function(d) { return "rouge"; },
    blue: function(d) { return "bleu"; },
    green: function(d) { return "vert"; }
  },
  "sub/folder/plural": {
    test: function(d) { return plural(d.NUM, 0, pluralFuncs.fr, { one: "Votre message se trouve", other: "Vos messages se trouvent" }) + " ici."; }
  }
}
})(this);
