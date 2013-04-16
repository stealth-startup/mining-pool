function Sha256 () {

};

Sha256.prototype = {


  midstate : function(str) {

    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
             0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
             0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
             0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
             0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
             0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
             0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
             0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

    var W = this.prepareData(str);

    for(var i=16;i<64;i++) {

      var s0 = this.sigma0(W[i-15]);

      var s1 = this.sigma1(W[i-2]);

      W[i] = (W[i-16] + s0 + W[i-7] + s1) & 0xffffffff;    
    };


    var a = H[0];
    var b = H[1];
    var c = H[2];
    var d = H[3];
    var e = H[4];
    var f = H[5];
    var g = H[6];
    var h = H[7];

    for(i=0;i<64;i++) {
      s1 = this.Sigma1(e);
      
      var ch = this.Ch(e,f,g);
      
      var temp = h + s1 + ch + K[i] + W[i];
      
      d = (d+temp)  & 0xffffffff;

      s0 = this.Sigma0(a);

      var maj = this.Maj(a,b,c);

      temp = (temp + s0 + maj) & 0xffffffff;

      h = g;
      g = f;
      f = e;
      e = d;
      d = c;
      c = b;
      b = a;
      a = temp;

    }

    H[0] = (H[0] + a) & 0xffffffff;
    H[1] = (H[1] + b) & 0xffffffff;
    H[2] = (H[2] + c) & 0xffffffff;
    H[3] = (H[3] + d) & 0xffffffff;
    H[4] = (H[4] + e) & 0xffffffff;
    H[5] = (H[5] + f) & 0xffffffff;
    H[6] = (H[6] + g) & 0xffffffff;
    H[7] = (H[7] + h) & 0xffffffff;

    return H.map(function(x){return Sha256.prototype.toHexStr(x);}).join("");

  } ,


  ROTR : function(n, x) { return (x >>> n) | (x << (32-n)); } ,
  Sigma0 : function(x) { return this.ROTR(2,  x) ^ this.ROTR(13, x) ^ this.ROTR(22, x); } ,
  Sigma1 : function(x) { return this.ROTR(6,  x) ^ this.ROTR(11, x) ^ this.ROTR(25, x); } ,
  sigma0 : function(x) { return this.ROTR(7,  x) ^ this.ROTR(18, x) ^ (x>>>3);  } ,
  sigma1 : function(x) { return this.ROTR(17, x) ^ this.ROTR(19, x) ^ (x>>>10); } ,
  Ch : function(x, y, z)  { return (x & y) ^ (~x & z); } ,
  Maj : function(x, y, z) { return (x & (y ^ z)) ^ (y & z); } ,

  toHexStr : function(n) {
    var s="", v;
    for (var i=3; i>=0; i--) { v = (n>>>(i*8)) & 0xff; s = ("0"+v.toString(16)).slice(-2) + s ; }
    return s;
  } ,


  toWORD : function(str) {
    var a,b,c,d;
    a=str.slice(0,2);
    b=str.slice(2,4);
    c=str.slice(4,6);
    d=str.slice(6,8);
    a=parseInt(a,16);  
    b=parseInt(b,16);  
    c=parseInt(c,16);  
    d=parseInt(d,16);  
    return ((d<<24) | (c<<16) | (b<<8) | a )>>>0;
  } ,


  prepareData : function(str) {
    var W = [];
    while(str.length>0) {
      var data=str.slice(0,8);
      W.push(this.toWORD(data));
      str=str.slice(8);
    }
    return W;
  }

};

exports.Sha256 = Sha256;
