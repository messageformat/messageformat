(function(){ window.i18n || (window.i18n = {}) 
var MessageFormat = { locale: {} };
MessageFormat.locale.en = function ( n ) {
  if ( n === 1 ) {
    return "one";
  }
  return "other";
};

window.i18n["colors"] = {}
window.i18n["colors"]["red"] = function(d){return "red";}
window.i18n["colors"]["blue"] = function(d){return "blue";}
window.i18n["colors"]["green"] = function(d){return "green";}
window.i18n["sub/folder/plural"] = {}
window.i18n["sub/folder/plural"]["test"] = function(d){
var r = "";
r += "Your ";
if(!d){
throw new Error("MessageFormat: No data passed to function.");
}
var lastkey_1 = "NUM";
var k_1=d[lastkey_1];
var off_0 = 0;
var pf_0 = { 
"one" : function(d){return "message";},
"other" : function(d){return "messages";}
};
if ( pf_0[ k_1 + "" ] ) {
r += pf_0[ k_1 + "" ]( d ); 
}
else {
r += (pf_0[ MessageFormat.locale["en"]( k_1 - off_0 ) ] || pf_0[ "other" ] )( d );
}
r += " go here.";
return r;
}
})();