var job = new (require('./jobs'))();

var label = "10000 getwork";

if(job.is_native) {
  console.log("using native midstate");
} 

console.time(label);

for(var i=0;i<10000;i++) {
  job.getwork();
}

console.timeEnd(label);
