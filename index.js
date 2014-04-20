var Device = require('./lib/device')
  , util = require('util')
  , stream = require('stream')
  , configHandlers = require('./lib/config-handlers')
  , WeMo = new require('wemo');

// Give our driver a stream interface
util.inherits(wemoDriver,stream);

// Our greeting to the user.
var FIRST_RUN_ANNOUNCEMENT = {
  "contents": [
    { "type": "heading",      "text": "Belkin WeMo Driver Loaded" },
    { "type": "paragraph",    "text": "The driver will now search for devices." }
  ]
};

/**
 * Called when our client starts up
 * @constructor
 *
 * @param  {Object} opts Saved/default driver configuration
 * @param  {Object} app  The app event emitter
 * @param  {String} app.id The client serial number
 *
 * @property  {Function} save When called will save the contents of `opts`
 * @property  {Function} config Will be called when config data is received from the Ninja Platform
 *
 * @fires register - Emit this when you wish to register a device (see Device)
 * @fires config - Emit this when you wish to send config data back to the Ninja Platform
 */
function wemoDriver(opts,app) {

  var self = this;
  this._app = app;
  this._opts = opts;
  this._devices = {};

  app.on('client::up',function(){
	  
	  self._app.log.info('belkin-wemo-2: Starting up');
	  
	  var needSave = false;

    // The client is now connected to the Ninja Platform

    // Check if we have sent an announcement before.
    // If not, send one and save the fact that we have.
    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',FIRST_RUN_ANNOUNCEMENT);
      opts.hasSentAnnouncement = true;
      self.save();
    }
    
	if (!opts.pollrate) {
		self._app.log.info('belkin-wemo-2: Initialising polling options');
		opts.pollrate = 2;
		needSave = true;
	}

	if (needSave) {self.save();}
	
	self.startSearch();
	
	setInterval(function() {
		self.startSearch();
	}, 60000)

  });
};

wemoDriver.prototype.startSearch = function() {
	var self = this;
	
	self._app.log.debug('belkin-wemo-2: Searching for Belkin WeMo Devices');
	
	var client = WeMo.Search();
	client.on('found', function(devicedata) {
		var uuid = devicedata.UDN.split(':')[1];
		if (!self._devices[uuid]) {
			self._devices[uuid] = {};
			self._devices[uuid].ip = devicedata.ip.toString();
			self._devices[uuid].port = devicedata.port.toString();
			self._devices[uuid].active = false;
			self._devices[uuid].client = new Device(self, devicedata);
			self.emit('register', self._devices[uuid].client);
			self._app.log.debug('belkin-wemo-2: ' + uuid + ' New device found at ' + devicedata.ip.toString() + ':' + devicedata.port.toString());
		} else {
			if ((self._devices[uuid].ip === devicedata.ip && self._devices[uuid].port === devicedata.port) && self._devices[uuid].active) {
				//self._app.log.debug('belkin-wemo-2: ' + uuid + ' Discovered already active device at ' + devicedata.ip.toString() + ':' + devicedata.port.toString());
			} else if ((self._devices[uuid].ip === devicedata.ip && self._devices[uuid].port === devicedata.port) &! self._devices[uuid].active) {
				self._app.log.debug('belkin-wemo-2: ' + uuid + ' Discovered halted device back at ' + devicedata.ip.toString() + ':' + devicedata.port.toString());
				self._devices[uuid].client.refreshAndPoll(devicedata);
			} else {
				self._app.log.debug('belkin-wemo-2: ' + uuid + ' Device at ' + self._devices[uuid].ip + ':' + self._devices[uuid].port +' has changed to ' + devicedata.ip.toString() + ':' + devicedata.port.toString());
				self._devices[uuid].ip = devicedata.ip;
				self._devices[uuid].port= devicedata.port;
				self._devices[uuid].client.refreshAndPoll(devicedata);
			}
		}
	});
}

/**
 * Called when a user prompts a configuration.
 * If `rpc` is null, the user is asking for a menu of actions
 * This menu should have rpc_methods attached to them
 *
 * @param  {Object}   rpc     RPC Object
 * @param  {String}   rpc.method The method from the last payload
 * @param  {Object}   rpc.params Any input data the user provided
 * @param  {Function} cb      Used to match up requests.
 */
wemoDriver.prototype.config = function(rpc,cb) {

  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,cb);
  }
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,rpc.params,cb);
  }
  else {
    return cb(true);
  }
};


// Export it
module.exports = wemoDriver;
