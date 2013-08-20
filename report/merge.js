Array.prototype.unique = function(f) {
  var a = this.concat();
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(f(a[i]) === f(a[j]))
        a.splice(j--, 1);
    }
  }
  return a;
};

function merge(arr1,arr2) {
  return arr2.concat(arr1).unique(function(item){return item.url;}); 
}

function merge2(arr1,arr2) {
  return arr2.concat(arr1).unique(function(item){return item;}); 
}

exports.merge = merge;
exports.merge2 = merge2;
