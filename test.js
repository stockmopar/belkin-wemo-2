var EventEmitter = require('events').EventEmitter;

var opts = {};

var app = new EventEmitter();
app.log = {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
};

var driver = new (require('./index'))(opts, app);

driver.on('register', function(device) {
  console.log('Driver.register', device);
  device.on('data', function(value) {
      console.log('Device.emit name:', device.name, 'D:', device.D, 'data:', value);
  });
 
  if (device.D == 238 || device.D == 1009) { //It's a relay
    var x = false;
    setInterval(function() {
       device.write(x=!x);
    }, 2000);
  }

});

driver.save = function() {
  console.log('Saved opts', opts);
};

setTimeout(function() {
  app.emit('client::up');
}, 500);
