const { options } = require('marked');
var instance_skel = require('../../instance_skel');
var xmlbuilder = require('xmlbuilder')
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
			value: 'This module allows you to control a Cisco VTC Unit (CE-based) with Companion.'
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
			id: 'user',
			label: 'Username',
			width: 12,
			default: 'admin',
			required: true
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 12,
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
		'dial': {
			label: 'Call/Dial Number',
			options: [
				{
				type: 'textinput',
				label: 'Dial String',
				id: 'number',
				width: 30,
				default: ''
				},
				{
				type: 'dropdown',
				label: 'Protocol',
				id: 'protocol',
				default: 'Sip',
				choices: [
					{ id: 'H320', label: 'H320' },
					{ id: 'H323', label: 'H323' },
					{ id: 'Sip', label: 'Sip' },
					{ id: 'Spark', label: 'Spark' }
					]
				}
			]
		},
		'call-disconnect': {
			label: 'Disconnect/Hang up'
		},
		'call-dtmfsend': {
			label: 'Send DTMF',
			options: [
				{
				type: 'textinput',
				label: 'DTMF String',
				id: 'dtmfstring',
				width: 30,
				default: ''
				}
			]
		}
	});
}

instance.prototype.action = function(action) {
	var self = this;

	if (self.config.ip) {
		//create the url for the request
		var cmd = "http://" + self.config.ip + "/putxml"

		switch (action.action) {
			case 'dial':
				var command = {
					Dial : {
						'@command': 'True',
						Number    : action.options.number,
						Protocol  : action.options.protocol
					}
				};
				break;
			case 'call-disconnect':
				var command = {
					Call : {
						Disconnect : {}
					}
				};
				break;
			case 'call-dtmfsend':
				var command = {
					Call : {
						DTMFSend : {
							DTMFString : action.options.dtmfstring
						}
					}
				};
		};

		var message = {Command: command};

		var strCommand = xmlbuilder.create(message).end({ pretty: true});

		var headers = {};
		headers["Content-Type"] = "text/xml";

		var options_auth = { user: self.config.user, password: self.config.password };

		self.system.emit('rest', cmd, strCommand, function (err, result) {
			if (err !== null) {
				self.status(self.STATUS_ERROR, 'Cisco VTC Request Failed. Type: ' + action.action);
				self.log('error', 'Cisco VTC Request Failed. Type: ' + action.action);
			}
			else {
				self.status(self.STATUS_OK);
			}
		}, headers, options_auth);
	}	
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
