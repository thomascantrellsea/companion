
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
			value: 'This module allows you to control the Elgato Keylight and Ringlight family with Companion.'
		},
		{
			type: 'textinput',
			id: 'ip',
			label: 'IP',
			width: 12,
			regex: self.REGEX_IP,
			default: '192.168.1.1',
			required: true
		},
		{
			type: 'textinput',
			id: 'key',
			label: 'Username / Key',
			width: 40,
			default: '',
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
		'set-scene': {
			label: 'Set Scene',
			options: [
				{
				type: 'number',
				label: 'Light Group',
				id: 'group',
				default: 1,
				min: 1,
				max: 255,
				required: true,
				},
				{
				type: 'textinput',
				label: 'Scene Id',
				id: 'scene',
				width: 30,
				default: ''
				}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;

	self.log('info', 'Hue entry. Type: ' + action.action);
	self.log('info', 'IP: ' + self.config.ip);
	self.log('info', 'Key: ' + self.config.key);

	if (self.config.ip && self.config.key && action.action == 'set-scene') {
		//create the url for the request
		var cmd = "http://" + self.config.ip + "/api/" + self.config.key;
		cmd = cmd + "/groups/" + action.options.group + "/action"

		console.log(cmd);
		self.log('info', "URL: " + cmd);

		let command = {};
		command.scene = action.options.scene;
		let strCommand = JSON.stringify(command);
		console.log(strCommand);

		self.system.emit('rest_put', cmd, strCommand, function (err, result) {
			if (err !== null) {
				self.status(self.STATUS_ERROR, 'Hue Change Request Failed. Type: ' + action.action);
				self.log('error', 'Hue Change Request Failed. Type: ' + action.action);
			}
			else {
				self.status(self.STATUS_OK);
			}
		});
	}	
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
