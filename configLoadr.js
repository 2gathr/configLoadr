var fs = require('fs'),
	async = require('async'),
	aObject = require('./aObject.js');

ConfigLoadr.globalNamespace = '$globalNamespace';
ConfigLoadr.defaultEnvironment = '$defaultEnvironment';

var defaultOptions = {
	namespace: ConfigLoadr.globalNamespace,
	environments: [ConfigLoadr.defaultEnvironment],
	environmentStoreType: 'extension',
	configDirectory: 'config'
};

function ConfigLoadr(load, options_next, next) {
	var sortedArguments = sortArguments(options_next, next);
	this.options = sortedArguments.options;
	next = sortedArguments.callback;
	this.globalConfig = {};
	this.configNamespaces = {};
	loadConfig(load, {global: this.globalConfig, namespaces: this.configNamespaces}, this.options);
}

function sortArguments(options_callback, callback) {
	if (typeof options_callback == 'function') {
		callback = options_callback;
		options = defaultOptions;
	} else if (typeof options_callback == 'object') {
		options = options_callback;
		aObject.eachSync(defaultOptions, function(key, value) {
			if(typeof options[key] == 'undefined') {
				options[key] = value;
			}
		});
	} else {
		throw new Error('unsupported type of options / next: ' + typeof options_next);
	}
	return {
		options: options,
		callback: callback
	};
}

function loadConfig(load, config, options) {
	if(typeof load == 'string') {
		load = [load];
	}
	if(typeof load == 'object') {
		async.each(load,
			function(file, nextFile) {
				getConfigFile(file, options, function(configFile) {
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
		throw new Error('unsupported type of load: ' + typeof load);
	}
}

function updateConfig(currentConfig, newConfig, namespace) {
	if(namespace == ConfigLoadr.globalNamespace) {
		updateObject(currentConfig.global, newConfig);
	} else {
		if(typeof currentConfig.namespaces[namespace] == 'undefined') {
			currentConfig.namespaces[namespace] = {};
		}
		updateConfig(currentConfig.namespaces[namespace], newConfig);
	}
}

function getConfigFile(file, options, next) {
	var noFileFound = true,
		config = {};
	async.each(options.environments,
		function(environment, nextEnvironment) {
			getConfig(file, environment, options, function(error, configEnvironment) {
				if(error) {
					return nextEnvironment();
				}
				noFileFound = false;
				updateObject(config, configEnvironment);
				nextEnvironment();
			});
		},
		function(error) {
			if(noFileFound) {
				throw new Error('no environment files found for file: ' + file);
			}
			next();
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
			return updateConfig(newObject[key], currentObject[key]);
		}
		currentObject[key] = newObject[key];
	});
}

module.exports = ConfigLoadr;
