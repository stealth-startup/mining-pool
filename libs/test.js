var sha256 = new (require('./sha256')).Sha256();

var str='0000000293d5a732e749dbb3ea84318bd0219240a2e2945046015880000003f5000000008d8e2673e5a071a2c83c86e28033b1a0a4aac90dde7a0670827cd0c3';

console.time("calculate midstate 10000 times");

for(var i=0;i<10000;i++) {
  sha256.midstate(str);  
}

console.timeEnd("calculate midstate 10000 times");
