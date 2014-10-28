ConfigLoadr = require('./configLoadr.js');

config = new ConfigLoadr ('global', {environments: ['dev']}, function(error, config) {
	console.log(config);
});
