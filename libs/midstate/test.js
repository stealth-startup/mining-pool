var hashlib = require("./build/Release/hashlib");

console.time("calculate midstate 10000 times");

for(var i=0;i<10000;i++) {
    hashlib.midstate('0000000293d5a732e749dbb3ea84318bd0219240a2e2945046015880000003f5000000008d8e2673e5a071a2c83c86e28033b1a0a4aac90dde7a0670827cd0c3');
}

console.timeEnd("calculate midstate 10000 times");


