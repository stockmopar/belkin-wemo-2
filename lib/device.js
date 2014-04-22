var stream = require('stream'),
	util = require('util'),
	WeMo = new require('wemo');

// Give our device a stream interface
util.inherits(Device, stream);

//Export it
module.exports = Device;

/**
 * Creates a new Device Object
 *
 * @property {Boolean} readable Whether the device emits data
 * @property {Boolean} writable Whether the data can be actuated
 *
 * @property {Number} G - the channel of this device
 * @property {Number} V - the vendor ID of this device
 * @property {Number} D - the device ID of this device
 *
 * @property {Function} write Called when data is received from the Ninja Platform
 *
 * @fires data - Emit this when you wish to send data to the Ninja Platform
 */
function Device(driver, deviceinfo) {

	var self = this;

	this._app = driver._app;
	this._opts = driver._opts;
	this._driver = driver;

	this._uuid = deviceinfo.UDN.split(':')[1];
	this.name = deviceinfo.friendlyName;
	this._fulltype = deviceinfo.deviceType;
	this._type = deviceinfo.deviceType.split(':')[3];
	this._model = deviceinfo.modelName;
	this._ip = deviceinfo.ip;
	this._port = deviceinfo.port;
	this._rate = this._opts.pollrate*1000 || 2000;
	

	this.G = "WeMo" + this._uuid.replace(/[-_]/g, ''); // G is a string a represents the channel
	
	switch (this._type) {
	case 'controllee':
		// This device will emit data
		this.readable = true;
		// This device can be actuated
		this.writeable = true;

		this.V = 0; // 0 is Ninja Blocks' device list
		this.D = 1009; // http://ninjablocks.com/pages/device-ids
		//this.D = 207; // Actuator and Sensor
		break;
	case 'lightswitch':
		// This device will emit data
		this.readable = true;
		// This device can be actuated
		this.writeable = true;

		this.V = 0; // 0 is Ninja Blocks' device list
		this.D = 1009; // http://ninjablocks.com/pages/device-ids
		//this.D = 207; // Actuator and Sensor
		break;
	case 'sensor':
		// This device will emit data
		this.readable = true;
		// This device can be actuated
		this.writeable = false;

		this.V = 0; // 0 is Ninja Blocks' device list
		this.D = 7; // http://ninjablocks.com/pages/device-ids
		break;
	}

	var wemoDevice = this._wemoDevice = new WeMo(this._ip, this._port);

	process.nextTick(function () {
		self.startPoll();
	});
};

Device.prototype.startPoll = function() {
	var self = this;
	
	self._driver._devices[self._uuid].active = true;
	
	self._wemoDevice.getBinaryState(function (err, result) {
		if (err) {
			self.gone();
		} else {
			self.updateemit(result);
			setTimeout(function() {
				self.startPoll();
			}, self._rate);
		}
	});
}

Device.prototype.gone = function() {
	var self = this;
	self._app.log.info('belkin-wemo-2: Lost ' + self._uuid + ', ceasing to poll.');
	self._driver._devices[self._uuid].active = false;
	delete self._wemoDevice;
}

Device.prototype.refreshAndPoll = function(deviceinfo) {
	var self = this;
	
	self.name = deviceinfo.friendlyName;
	self._fulltype = deviceinfo.deviceType;
	self._type = deviceinfo.deviceType.split(':')[3];
	self._model = deviceinfo.modelName;
	self._ip = deviceinfo.ip;
	self._port = deviceinfo.port;
	self._rate = this._opts.pollrate*1000 || 2000;
	
	self._wemoDevice = new WeMo(self._ip, self._port);
	
	self.startPoll();
}

Device.prototype.updateemit = function(result) {
	var self = this;
	
	if( result !== self._state ) {
		self._state = result;
		switch (self._type) {
		case 'controllee':
			switch (result) {
			case '0':
				self.emit('data', 0);
				break;
			case '1':
				self.emit('data', 1);
				break;
			}
			break;
		case 'sensor':
			switch (result) {
			case '1':
				self.emit('data', 0);
				break;
			}
			break;
		}
	}
}

/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
Device.prototype.write = function (data) {

	var self = this;

	switch (self._type) {
	case 'controllee':
		self._wemoDevice.setBinaryState(data, function (err, result) {
			if (err) { 
				self.gone();
			} else {
				self._wemoDevice.getBinaryState(function (err, result) {
					if (err) {
						self.gone();
					} else {
						self.updateemit(result);
					}
				});				
			}

		});
		break;
	}

};