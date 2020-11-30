
const { options } = require('marked');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;

	self.status(self.STATE_OK);
}

instance.prototype.init = function() {
	var self = this;

	self.status(self.STATE_OK);
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module allows you to control a Philips Hue Bridge with Companion.'
		},
		{
			type: 'textinput',
			id: 'ip',
			label: 'IP',
			width: 12,
			regex: self.REGEX_IP,
			default: '192.168.1.1',
			required: true
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;
	debug("destroy");
}

instance.prototype.actions = function(system) {
	var self = this;

	self.setActions({
		'call': {
			label: 'Call Number',
			options: [
				{
				type: 'textinput',
				label: 'Dial String',
				id: 'number',
				width: 30,
				default: ''
				}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;

	if (self.config.ip && action.options.number && action.action == 'call') {
		//create the url for the request
		var cmd = "http://" + self.config.ip + "/putxml"

		console.log(cmd);
		self.log('info', "URL: " + cmd);

		var command = "<Command><Dial command='True'><Number>";
		command = command + action.options.number;
		command = command + "</Number><Protocol>SIP</Protocol></Dial></Command>";

		self.log('info',"Command: " + command);

		var headers = {};
		headers["Content-Type"] = "text/xml";

		var options_auth = { user: "admin", password: "" };

		self.system.emit('rest', cmd, command, function (err, result) {
			if (err !== null) {
				self.status(self.STATUS_ERROR, 'Cisco VTC Request Failed. Type: ' + action.action);
				self.log('error', 'Cisco VTC Request Failed. Type: ' + action.action);
			}
			else {
				console.log(result);
				self.status(self.STATUS_OK);
			}
		}, headers, options_auth);
	}	
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
