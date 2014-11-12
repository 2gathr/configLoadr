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

## Fucntions
### new ConfigLoadr()
```node
var configLoadr = new ConfigLoadr(mixed files, function next);
var configLoadr = new ConfigLoadr(mixed files, object options, fucntion next);
```
Creates a new instance of ConfigLoadr and loads `files` with optional `options`, when all files are loaded, `next` is called.

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
