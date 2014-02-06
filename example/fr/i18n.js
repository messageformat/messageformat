(function(){ window.i18n || (window.i18n = {}) 
var MessageFormat = { locale: {} };
MessageFormat.locale.fr = function (n) {
  if (n >= 0 && n < 2) {
    return 'one';
  }
  return 'other';
};

window.i18n["sub/folder/plural"] = {}
window.i18n["sub/folder/plural"]["test"] = function(d){
var r = "";
if(!d){
throw new Error("MessageFormat: No data passed to function.");
}
var lastkey_1 = "NUM";
var k_1=d[lastkey_1];
var off_0 = 0;
var pf_0 = { 
"one" : function(d){return "Votre message se trouve";},
"other" : function(d){return "Vos messages se trouvent";}
};
if ( pf_0[ k_1 + "" ] ) {
r += pf_0[ k_1 + "" ]( d ); 
}
else {
r += (pf_0[ MessageFormat.locale["fr"]( k_1 - off_0 ) ] || pf_0[ "other" ] )( d );
}
r += " ici.";
return r;
}
window.i18n["colors"] = {}
window.i18n["colors"]["red"] = function(d){return "rouge";}
window.i18n["colors"]["blue"] = function(d){return "bleu";}
window.i18n["colors"]["green"] = function(d){return "vert";}
})();