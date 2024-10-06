function getAllObjects(obj, level) {
  if (typeof obj !== 'object') throw new Error('non-object value');
  if (level === 0) {
    return [obj];
  } else if (level === 1) {
    return Object.keys(obj).map(k => obj[k]);
  } else {
    return Object.keys(obj)
      .map(k => getAllObjects(obj[k], level - 1))
      .reduce((a, b) => a.concat(b), []);
  }
}

module.exports = function simplifyInput(input) {
  var lvl = 0;
  try {
    while (true) {
      var objects = getAllObjects(input, lvl);
      var keysets = objects.map(obj =>
        Object.keys(obj).map(k => {
          if (typeof obj[k] !== 'object') throw new Error('non-object value');
          return Object.keys(obj[k]);
        })
      );
      var key0 = keysets[0][0][0];
      if (
        keysets.every(keyset =>
          keyset.every(ks => ks.length === 1 && ks[0] === key0)
        )
      ) {
        objects.forEach(obj =>
          Object.keys(obj).forEach(k => (obj[k] = obj[k][key0]))
        );
      } else {
        ++lvl;
      }
    }
  } catch (e) {
    if (e.message !== 'non-object value') throw e;
  }
};
