var job = new (require('./jobs'))();

for(var i=0;i<10000;i++) {
  job.getwork();
}
