var fs = require('fs'),
	async = require('async'),
	objectAnalyzr = require('object-analyzr'),
	path = require('path');

ConfigLoadr.globalNamespace = '$globalNamespace';
ConfigLoadr.defaultEnvironment = '$defaultEnvironment';
ConfigLoadr.completeConfig = '$completeConfig';

var defaultOptions = {
	namespace: ConfigLoadr.globalNamespace,
	environments: ConfigLoadr.defaultEnvironment,
	environmentStoreType: 'extension',
	configDirectory: 'config',
	base: path.dirname(require.main.filename)
};

function ConfigLoadr() {
	var parsedArguments = parseArguments(arguments),
		load = parsedArguments.load,
		options = parsedArguments.options,
		next = parsedArguments.callback,
		_this = this;
	if(typeof options.saveOptions == 'undefined' || options.saveOptions === true) this.options = options;
	this.globalConfig = {};
	this.configNamespaces = {};
	if(typeof options.syncConfig == 'undefined' || options.syncConfig === true) {
		if(typeof global.configLoadr == 'undefined') {
			global.configLoadr = {
				globalConfig: {},
				configNamespaces: {}
			};
		}
		this.globalConfig = global.configLoadr.globalConfig;
		this.configNamespaces = global.configLoadr.configNamespaces;
	}
	loadConfig(load,
		{
			global: this.globalConfig,
			namespaces: this.configNamespaces
		},
		options,
		function(err, config) {
			if(err) return next(err);
			next(null, {
				global: _this.globalConfig,
				namespaces: _this.configNamespaces
			});
		}
	);
}

ConfigLoadr.prototype.load = function() {
	var parsedArguments = parseArguments(arguments, this.options),
		load = parsedArguments.load,
		options = parsedArguments.options,
		next = parsedArguments.callback;
	if(options.saveOptions === true) this.options = options;
	var _this = this;
	loadConfig(load, {global: this.globalConfig, namespaces: this.configNamespaces}, options, function(err, config) {
		if(err) return next(err);
		next(null, {
			global: _this.globalConfig,
			namespaces: _this.configNamespaces
		});
	});
};

ConfigLoadr.prototype.setOptions = function() {
	var parsedArguments = parseArguments(arguments, this.options);
	this.options = parsedArguments.options;
};

ConfigLoadr.prototype.get = function(namespaces, includeGlobalConfig) {
	var returnObject = {};
	if(typeof includeGlobalConfig == 'undefined' || includeGlobalConfig) returnObject = this.globalConfig;
	if(typeof namespaces != 'undefined') {
		if(typeof namespaces == 'string') {
			if(namespaces == ConfigLoadr.completeConfig) {
				aObject.eachSync(this.configNamespaces, function(namespace, configNamespace) {
					returnObject[key] = value;
				});
			} else returnObject[namespaces] = this.configNamespaces[namespaces];
		} else if(typeof namespaces == 'object') {
			namespaces.forEach(function(namespace, key) {
				returnObject[namespace] = this.configNamespaces[namespace];
			});
		} else throw new TypeError('unsupported type of namespaces');
	}
	return returnObject;
};

function parseArguments(givenArguments, instanceOptions) {
	if(givenArguments.length > 3) return new Error('too many arguments given');
	if(typeof instanceOptions == 'undefined' || instanceOptions.resetOptions === true) instanceOptions = defaultOptions;
	var parsedArguments = {
		load: [],
		options: instanceOptions,
		callback: function() {}
	};
	aObject.eachSync(givenArguments, function(keyArgument, argument) {
		switch(typeof argument) {
			case 'function':
				parsedArguments.callback = argument;
				break;
			case 'object':
				if(Array.isArray(argument)) parsedArguments.load = argument;
				else {
					aObject.eachSync(parsedArguments.options, function(keyOption, value) {
						if(typeof argument[keyOption] != 'undefined') parsedArguments.options[keyOption] = argument[keyOption];
					});
				}
				break;
			case 'string':
				parsedArguments.load = [argument];
		}
	});
	return parsedArguments;
}

function loadConfig(load, config, options, next) {
	if(typeof load == 'object') {
		async.each(load,
			function(file, nextFile) {
				getConfigFile(file, options, function(err, configFile) {
					if(err) return nextFile(err);
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
			function(err) {
				if(err) return next(err);
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
	if(namespace == ConfigLoadr.globalNamespace) aObject.update(currentConfig.global, newConfig);
	else {
		if(namespace == 'global') throw new Error('namespace global is not allowed');
		if(typeof currentConfig.namespaces[namespace] == 'undefined') currentConfig.namespaces[namespace] = {};
		aObject.update(currentConfig.namespaces[namespace], newConfig);
	}
}

function getConfigFile(file, options, next) {
	var noFileFound = true,
		configFile = {};
	if(typeof options.environments == 'string') options.environments = [options.environments];
	async.each(options.environments,
		function(environment, nextEnvironment) {
			getConfigEnvironment(file, environment, options, function(err, configEnvironment) {
				if(err) return nextEnvironment(err);
				noFileFound = false;
				aObject.update(configFile, configEnvironment);
				nextEnvironment();
			});
		},
		function(err) {
			if(noFileFound) return next(new Error('no environment files found for file: ' + file));
			if(err) return next(err);
			next(null, configFile);
		}
	);
}

function getConfigEnvironment(file, environment, options, next) {
	if(environment == ConfigLoadr.defaultEnvironment) environment = 'default';
	var environmentFile = options.base + '/' + options.configDirectory + '/';
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
			return next(new Error('unknown environmentStoreType: ' + options.environmentStoreType));
	}
	fs.readFile(environmentFile + '.json', {encoding: 'utf8'}, function(err, data) {
		if (err) return next(err);
		var configEnvironment = JSON.parse(data);
		if(options.environmentStoreType == 'object') {
			configEnvironment = configEnvironment[environment];
			if (typeof configEnvironment == 'undefined') return next();
		}
		next(null, configEnvironment);
	});
}

module.exports = ConfigLoadr;
