Array.prototype.unique = function(f) {
  var a = this.concat();
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(f(a[i]) === f(a[j]))
        a.splice(i--, 1);
    }
  }
  return a;
};

function merge(arr1,arr2) {
  return arr1.concat(arr2).unique(function(item){return item.url;}); 
}

module.exports = merge;
