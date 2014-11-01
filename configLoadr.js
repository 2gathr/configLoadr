var fs = require('fs'),
	async = require('async'),
	aObject = require('./aObject.js');

ConfigLoadr.globalNamespace = '$globalNamespace';
ConfigLoadr.defaultEnvironment = '$defaultEnvironment';
ConfigLoadr.completeConfig = '$completeConfig';

var defaultOptions = {
	namespace: ConfigLoadr.globalNamespace,
	environments: [ConfigLoadr.defaultEnvironment],
	environmentStoreType: 'extension',
	configDirectory: 'config'
};

function ConfigLoadr(load, options_next, next) {
	var parsedArguments = parseArguments(options_next, next);
	options = parsedArguments.options;
	next = parsedArguments.callback;
	if(options.saveOptions === true) {
		this.options = options;
	}
	this.globalConfig = {};
	this.configNamespaces = {};
	var thisCL = this;
	loadConfig(load,
		{
			global: this.globalConfig,
			namespaces: this.configNamespaces
		},
		options,
		function(error, config) {
			next(null, {
				global: thisCL.globalConfig,
				namespaces: thisCL.configNamespaces
			});
		}
	);
}

ConfigLoadr.prototype.load = function(load, options_next, next) {
	var parsedArguments = parseArguments(options_next, next, this.options);
	options = parsedArguments.options;
	next = parsedArguments.callback;
	if(options.saveOptions === true) {
		this.options = options;
	}
	loadConfig(load, {global: this.globalConfig, namespaces: this.configNamespaces}, options, function(error, config) {
		next(null, {
			global: thisCL.globalConfig,
			namespaces: thisCL.configNamespaces
		});
	});
};

ConfigLoadr.prototype.setOptions = function(options) {
	var parsedArguments = parseArguments(options, this.options);
	this.options = parsedArguments.options;
};

ConfigLoadr.prototype.get = function(namespaces) {
	if(typeof namespaces == 'undefined') {
		returnObject = this.globalConfig;
	} else {
		if(typeof namespaces == 'string') {
			if(namespaces == ConfigLoadr.completeConfig) {
				aObject.eachSync(this.configNamespaces, function(namespace, configNamespace) {
					returnObject[key] = value;
				});
			} else {
				returnObject[namespaces] = this.configNamespaces.namespace;
			}
		} else if(typeof namespaces == 'object') {
			namespaces.forEach(function(key, namespace) {
				returnObject[namespace] = this.configNamespaces[namespace];
			});
		} else {
			throw new TypeError('unsupported type of namespaces');
		}
	}
	return returnObject;
};

function parseArguments(options_callback, callback_instanceOptions, instanceOptions) {
	if(typeof instanceOptions == 'undefined') {
		instanceOptions = defaultOptions;
	}
	if (typeof options_callback == 'function') {
		callback = options_callback;
		options = instanceOptions;
	} else if (typeof options_callback == 'object') {
		if(typeof callback_instanceOptions == 'object') {
			instanceOptions = callback_instanceOptions;
		} else {
			callback = callback_instanceOptions;
		}
		options = options_callback;
		if(options.resetOptions === true) {
			instanceOptions = defaultOptions;
		}
		aObject.eachSync(instanceOptions, function(key, value) {
			if(typeof options[key] == 'undefined') {
				options[key] = value;
			}
		});
	} else {
		throw new TypeError('unsupported type of options / callback: ' + typeof options_callback);
	}
	returnObject = {
		options: options
	};
	if (typeof callback == 'function') {
		returnObject.callback = callback;
	}
	return returnObject;
}

function loadConfig(load, config, options, next) {
	if(typeof load == 'string') {
		load = [load];
	}
	if(typeof load == 'object') {
		async.each(load,
			function(file, nextFile) {
				getConfigFile(file, options, function(error, configFile) {
					updateConfig(
						{
							global: config.global,
							namespaces: config.namespaces
						},
						configFile,
						options.namespace
					);
					nextFile();
				});
			},
			function(error) {
				next(null, {
					global: config.global,
					namespaces: config.namespaces
				});
			}
		);
	} else {
		throw new TypeError('unsupported type of load: ' + typeof load);
	}
}

function updateConfig(currentConfig, newConfig, namespace) {
	if(namespace == ConfigLoadr.globalNamespace) {
		updateObject(currentConfig.global, newConfig);
	} else {
		if(namespace == 'global') {
			throw new Error('namespace global is not allowed');
		}
		if(typeof currentConfig.namespaces[namespace] == 'undefined') {
			currentConfig.namespaces[namespace] = {};
		}
		updateObject(currentConfig.namespaces[namespace], newConfig);
	}
}

function getConfigFile(file, options, next) {
	var noFileFound = true,
		configFile = {};
	async.each(options.environments,
		function(environment, nextEnvironment) {
			getConfigEnvironment(file, environment, options, function(error, configEnvironment) {
				if(error) {
					return nextEnvironment();
				}
				noFileFound = false;
				updateObject(configFile, configEnvironment);
				nextEnvironment();
			});
		},
		function(error) {
			if(noFileFound) {
				throw new Error('no environment files found for file: ' + file);
			}
			next(null, configFile);
		}
	);
}

function getConfigEnvironment(file, environment, options, next) {
	if(environment == ConfigLoadr.defaultEnvironment) {
		environment = 'default';
	}
	var environmentFile = options.configDirectory + '/';
	switch(options.environmentStoreType) {
		case 'extension':
			environmentFile += file + '.' + environment;
			break;
		case 'file':
			environmentFile += file + '/' + environment;
			break;
		case 'directory':
			environmentFile += environment + '/' + file;
			break;
		case 'object':
			environmentFile += file;
			break;
		default:
			throw new Error('unknown environmentStoreType: ' + options.environmentStoreType);
	}
	fs.readFile(environmentFile + '.json', {encoding: 'utf8'}, function(error, data) {
		if (error) {
			return next(error);
		}
		var configEnvironment = JSON.parse(data);
		if(options.environmentStoreType == 'object') {
			configEnvironment = configEnvironment[environment];
			if (typeof configEnvironment == 'undefined') {
				return next();
			}
		}
		next(null, configEnvironment);
	});
}

function updateObject(currentObject, newObject) {
	Object.keys(newObject).forEach(function(key) {
		if(typeof newObject[key] == 'object') {
			if(typeof currentObject[key] == 'undefined') {
				currentObject[key] = {};
			}
			return updateObject(newObject[key], currentObject[key]);
		}
		currentObject[key] = newObject[key];
	});
}

module.exports = ConfigLoadr;
