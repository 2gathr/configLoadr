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
	var thisCL = this;
	if (typeof options_next == 'function') {
		next = options_next;
		this.options = defaultOptions;
	} else if (typeof options_next == 'object') {
		this.options = options_next;
		aObject.eachSync(defaultOptions, function(key, value) {
			if(typeof thisCL.options[key] == 'undefined') {
				thisCL.options[key] = value;
			}
		});
	} else {
		throw new Error('unsupported type of options / next: ' + typeof options_next);
	}
	this.globalConfig = {};
	this.configNamespaces = {};
	if(typeof load == 'string') {
		load = [load];
	}
	if(typeof load == 'object') {
		async.each(load,
			function(file, nextFile) {
				var noFileFound = true,
					configFile = {};
				async.each(thisCL.options.environments,
					function(environment, nextEnvironment) {
						if(environment == ConfigLoadr.defaultEnvironment) {
							environment = 'default';
						}
						var environmentFile = thisCL.options.configDirectory + '/';
						switch(thisCL.options.environmentStoreType) {
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
								return nextEnvironment();
							}
							var configEnvironment = JSON.parse(data);
							if(thisCL.options.environmentStoreType == 'object') {
								configEnvironment = configEnvironment[environment];
								if (typeof configEnvironment == 'undefined') {
									return nextEnvironment();
								}
							}
							updateConfig(configEnvironment, configFile);
							noFileFound = false;
							nextEnvironment();
						});
					},
					function(error) {
						if(noFileFound) {
							throw new Error('no environment files found for file: ' + file);
						}
						if(thisCL.options.namespace == ConfigLoadr.globalNamespace) {
							updateConfig(configFile, thisCL.globalConfig);
						} else {
							if(typeof thisCL.configNamespaces[thisCL.options.namespace] == 'undefined') {
								thisCL.configNamespaces[thisCL.options.namespace] = {};
							}
							updateConfig(configFile, thisCL.configNamespaces[thisCL.options.namespace]);
						}
						nextFile();
					}
				);
			},
			function(error) {
				next(null, {
					global: thisCL.globalConfig,
					namespaces: thisCL.configNamespaces
				});
			}
		);
	} else {
		throw new Error('unsupported type of load: ' + typeof load);
	}
}

function updateConfig(newConfig, currentConfig) {
	Object.keys(newConfig).forEach(function(key) {
		if(typeof newConfig[key] == 'object') {
			if(typeof currentConfig[key] == 'undefined') {
				currentConfig[key] = {};
			}
			return updateConfig(newConfig[key], currentConfig[key]);
		}
		currentConfig[key] = newConfig[key];
	});
}

module.exports = ConfigLoadr;
