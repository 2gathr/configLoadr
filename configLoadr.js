var fs = require('fs'),
	async = require('async'),
	aObject = require('./aObject');

ConfigLoadr.globalNamespace = '$globalNamespace';
ConfigLoadr.defaultEnvironment = '$defaultEnvironment';
ConfigLoadr.completeConfig = '$completeConfig';

var defaultOptions = {
	namespace: ConfigLoadr.globalNamespace,
	environments: ConfigLoadr.defaultEnvironment,
	environmentStoreType: 'extension',
	configDirectory: 'config',
};

function ConfigLoadr(load, options_next, next) { // underscore in argument is meant as slash, in following functions as well
	var parsedArguments = parseArguments(options_next, next);
	var options = parsedArguments.options;
	next = parsedArguments.cb;
	if(typeof options.saveOptions == 'undefined' || options.saveOptions === true) {
		this.options = options;
	}
	if(typeof global.configLoadr == 'undefined') {
		global.configLoadr = {
			globalConfig: {},
			configNamespaces: {}
		};
	}
	this.globalConfig = global.configLoadr.globalConfig;
	this.configNamespaces = global.configLoadr.configNamespaces;
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
	var options = parsedArguments.options;
	next = parsedArguments.cb;
	if(options.saveOptions === true) {
		this.options = options;
	}
	var thisCL = this;
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
	var returnObject = this.globalConfig;
	if(typeof namespaces != 'undefined') {
		if(typeof namespaces == 'string') {
			if(namespaces == ConfigLoadr.completeConfig) {
				aObject.eachSync(this.configNamespaces, function(namespace, configNamespace) {
					returnObject[key] = value;
				});
			} else {
				returnObject[namespaces] = this.configNamespaces[namespaces];
			}
		} else if(typeof namespaces == 'object') {
			namespaces.forEach(function(namespace, key) {
				returnObject[namespace] = this.configNamespaces[namespace];
			});
		} else {
			throw new TypeError('unsupported type of namespaces');
		}
	}
	return returnObject;
};

function parseArguments(options_cb, cb_instanceOptions, instanceOptions) {
	if(typeof instanceOptions == 'undefined') {
		instanceOptions = defaultOptions;
	}
	var cb, options;
	if (typeof options_cb == 'function') {
		cb = options_cb;
		options = instanceOptions;
	} else if (typeof options_cb == 'object') {
		if(typeof cb_instanceOptions == 'object') {
			instanceOptions = cb_instanceOptions;
		} else {
			cb = cb_instanceOptions;
		}
		options = options_cb;
		if(options.resetOptions === true) {
			instanceOptions = defaultOptions;
		}
		aObject.eachSync(instanceOptions, function(key, value) {
			if(typeof options[key] == 'undefined') {
				options[key] = value;
			}
		});
	} else {
		throw new TypeError('unsupported type of options / cb: ' + typeof options_cb);
	}
	var returnObject = {
		options: options
	};
	if (typeof cb == 'function') {
		returnObject.cb = cb;
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
	if(typeof options.environments == 'string') {
		options.environments = [options.environments];
	}
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
			return updateObject(currentObject[key], newObject[key]);
		}
		currentObject[key] = newObject[key];
	});
}

module.exports = ConfigLoadr;
