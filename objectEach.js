function objectEach(object, iterator, next) {
	var length = Object.keys(object).length,
		callbacks = object;
	if(typeof next == 'undefined') {
		next = function() {};
	}
	if (!length) {
		return next();
	}
	for(var key in object) {
		iterator(key, object[key], done);
	}
	function done(error) {
		if(error) {
			next = function() {};
			return next(error);
		}
		completed++;
		if(completed >= length) {
			next();
		}
	}
}

module.exports = objectEach;
