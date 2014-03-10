  MessageFormat.locale.is = function(n) {
    return ((n%10) === 1 && (n%100) !== 11) ? 'one' : 'other';
  };