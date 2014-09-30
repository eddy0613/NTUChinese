String.prototype.isEmpty = function() {
  return (this == '');
};
String.prototype.contains = function(it) {
  if (it instanceof Array) {
    for (var i in it) {
      if (this.indexOf(it[i]) != -1)
	return true;	
    }
    return false;
  }
  else
    return this.indexOf(it) != -1;
};
