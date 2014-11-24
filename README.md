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
Creates a new instance of ConfigLoadr and loads `files` with optional `options`, when all files are loaded, `next` is called.

#### Arguments
- mixed `load` - An array with config files to be loaded or a string with one file name.
- object `options` - An object with the options to use for config loading. Possible options are listed below.
	- string `namespace` - The namespace to be used to store the loaded config. Default: `ConfigLoadr.globalNamespace` which is `$globalNamespace` in the current versions. For best practices, you should use `ConfigLoadr.globalNamespace` if you want to store the loaded config in the global namespace.
	- mixed `environments` - An array with environments or a string with one environment to load config for. Default: `ConfigLoadr.defaultEnvironment` which is `$defaultEnvironment`. For best practices, you should use `ConfigLoadr.defaultEnvironment` if you want to load the default environment for the given config files, which will then be loaded with the environment `default`.
	- string `environmentStoreType` - The type how different environments are represented. Possible types are listed below.
		- `extension` - Config files are loaded as *name*.*environment*.json.
		- `file` - Config files are loaded as *name*/*environment*.json.
		- `directory` - Config files are loaded as *environment*/*name*.json.
		- `object` - Environments are the top objects in the config file *name*.json.
	- string `base` - The base directory of the node application, which should be the directory where your *app.js* is placed.
	- string `configDirectory` - The directory name where config files are stored. Therefore, your config files must be placed in *base*/*config*. Default: `config`.
	- boolean `saveOptions` - Whether the given options should be stored as instance options. Default: `true`.
- function `next` - A function to be called after all config files are loaded.

#### Example


### ConfigLoadr#load()
```node
configLoadr.load(mixed files, function next);
configLoadr.load(mixed files, object options, function next);
```
Loads `files` with optional `options`, when all files are loaded, `next` is called.

### ConfigLoadr#setOptions()
```node
configLoadr.setOptions(object options);
```

### ConfigLoadr#get()
```node
configLoadr.get(mixed namespaces, bool includeGlobalConfig);
```
