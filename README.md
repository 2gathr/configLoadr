# configLoadr
A Node.js module for loading config files

**License** [GNU GPL v3.0](https://github.com/2gathr/configLoadr/blob/master/LICENSE)

## Usage
```sh
npm install config-loadr
```
```node
var ConfigLoadr = require('config-loadr');
```

## Functions
### ConfigLoadr()
```node
var configLoadr = new ConfigLoadr([mixed load[, object options][, function next]]);
```
Creates a new instance of ConfigLoadr and loads all config files in `load` with optional `options`, when all files are loaded, `next` is called.

#### Arguments
- mixed `load` - An array with config files to be loaded or a string with one file name.
- object `options` - An object with the options to use for config loading. Possible options are listed below.
	- string `namespace` - The namespace to be used to store the loaded config. Default: `ConfigLoadr.globalNamespace` which is `$globalNamespace` in the current versions. For best practices, you should use `ConfigLoadr.globalNamespace` if you want to store the loaded config in the global namespace.
	- mixed `environments` - An array with environments or a string with one environment to load config for. Default: `ConfigLoadr.defaultEnvironment` which is `$defaultEnvironment`. For best practices, you should use `ConfigLoadr.defaultEnvironment` if you want to load the default environment for the given config files, which will then be loaded with the environment `default`.
	- string `environmentStoreType` - The type how different environments are represented. Possible types are listed below. Default: `extension`.
		- `extension` - Config files are loaded as *name*.*environment*.json.
		- `file` - Config files are loaded as *name*/*environment*.json.
		- `directory` - Config files are loaded as *environment*/*name*.json.
		- `object` - Environments are the top objects in the config file *name*.json.
	- string `base` - The base directory of the node application, which should be the directory where your *app.js* is placed. Default: Directory name of `require.main.filename` (parsed by `require('path').dirname()`), which will only work if you don't run your app through another app like pm2, mocha or forever (See http://nodejs.org/api/modules.html#modules_accessing_the_main_module).
	- string `configDirectory` - The directory name where config files are stored. Therefore, your config files must be placed in *base*/*config*. Default: `config`.
	- boolean `saveOptions` - Whether the given options should be stored as instance options. This options won't be stored as an instance option. Default: `true`.
	- boolean `syncConfig` - Whether config should be synced globally. If set to `true`, the config will be synced between all instances having `syncConfig` enabled as well. Default: `true`.
- function `next` - A function to be called when all config files are loaded, the function is called with the 2 arguments listed below.
	- `error` - If an error happens, `error` contains a description of the error. Not functional yet.
	- object `config` - An object with the config loaded. It contains the key `global`, which is the config loaded into global namespace (config.global.*option*), and the key `namespaces`, where all namespace config is stored (config.namespaces.*namespace*.*option*).

#### Example
```node
// loads config/main/development.json, config/main/production.json, config/database/development.json and config/database/production.json into global namespace
var configLoadr = new ConfigLoadr(
	[
		'main',
		'database'
	],
	{
		environments: ['development', 'production']
		environmentStoreType: 'file',
	},
	function(error, config) {
		console.log('Global config: ' + config.global);
		console.log('Namespace config: ' + config.namespaces);
	}
);
```

### ConfigLoadr#load()
```node
configLoadr.load(mixed load[, object options][, function next]);
```
Loads all config files in `load` with optional `options`, when all files are loaded, `next` is called.

#### Arguments
- mixed `load` - An array with config files to be loaded or a string with one file name.
- object `options` - An object with the options to use for config loading. Possible options are listed below.
	- string `namespace` - The namespace to be used to store the loaded config. Default: `ConfigLoadr.globalNamespace` which is `$globalNamespace` in the current versions. For best practices, you should use `ConfigLoadr.globalNamespace` if you want to store the loaded config in the global namespace.
	- mixed `environments` - An array with environments or a string with one environment to load config for. Default: `ConfigLoadr.defaultEnvironment` which is `$defaultEnvironment`. For best practices, you should use `ConfigLoadr.defaultEnvironment` if you want to load the default environment for the given config files, which will then be loaded with the environment `default`.
	- string `environmentStoreType` - The type how different environments are represented. Possible types are listed below. Default: `extension`.
	- `extension` - Config files are loaded as *name*.*environment*.json.
	- `file` - Config files are loaded as *name*/*environment*.json.
	- `directory` - Config files are loaded as *environment*/*name*.json.
	- `object` - Environments are the top objects in the config file *name*.json.
	- string `base` - The base directory of the node application, which should be the directory where your *app.js* is placed. Default: `require.main.filename`, which will only work if you don't run your app through another app like pm2, mocha or forever (See http://nodejs.org/api/modules.html#modules_accessing_the_main_module).
	- string `configDirectory` - The directory name where config files are stored. Therefore, your config files must be placed in *base*/*config*. Default: `config`.
	- boolean `saveOptions` - Whether the given options should be stored as instance options. This option itself won't be stored as an instance option. Default: `true`.
	- boolean `resetOptions` - Whether instance options (`false`) or the default options (`true`) should be used as default values. This option  won't be stored as an instance option. Default: `false`.
- function `next` - A function to be called when all config files are loaded, the function is called with 2 arguments listed below.
	- `error` - If an error happens, `error` contains a description of the error. Not functional yet.
	- object `config` - An object with the config loaded. It contains the key `global`, which is the config loaded into global namespace (config.global.*option*), and the key `namespaces`, where all namespace config is stored (config.namespaces.*namespace*.*option*).

#### Example
```node
// loads config/analytics.production.json, config/analytics.test2.json, config/client.production.json and config/client.test2.json into namespace extra, default options instead of instance options are used as default values, the options aren't saved as instance options
configLoadr.load(
	[
		'analytics',
		'client'
	],
	{
		namespace: 'extra'
		environments: ['production', 'test2'],
		resetOptions: true,
		saveOptions: false
	},
	function(error, config) {
		console.log('Global config: ' + config.global);
		console.log('Namespace config: ' + config.namespaces);
	}
);
```

### ConfigLoadr#setOptions()
```node
configLoadr.setOptions(object options);
```
Sets the given `options` as instance options.

#### Arguments
- object `options` - An object with the options to be stored as instance options. Options not stored as instance options are listed below
	- boolean `resetOptions` - Whether instance options (`false`) or the default options (`true`) should be used as default values.

#### Example
```node
// use default options instead of instance options as default values and save the options as instance options
configLoadr.setOptions(
	[
		namespace: 'permissions',
		environments: 'production',
		resetOptions: true
	]
);
```

### ConfigLoadr#get()
```node
configLoadr.get([mixed namespaces[, boolean includeGlobalConfig]]);
```
Gets the config of the given `namespaces`. Defaultly, global config is returned as well.

#### Arguments
- mixed `namespaces` - An array with namespaces or a string with one namespace to get the config of. The namespace config is stored in different namespace objects (like config.*namespace*.*option*).
- boolean `includeGlobalConfig` - Wether to include global config as well. Global config will be added into the top level of the object (like config.*option*). Default: `true`.

#### Example
```node
// will get namespace "extra", "app" & global config
configLoadr.get([
	'extra',
	'app'
]);
// will only get namespace "permissions" options.
configLoadr.get('permissions', false);
```
