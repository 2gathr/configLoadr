var aObject = {};

aObject.each = function(object, iterator, next) {
	var length = Object.keys(object).length,
		completed = 0,
		root,
		execute = true;
	if(typeof next == 'undefined') {
		next = function() {};
	}
	if (!length) {
		return next();
	}
	for(var key in object) {
		iterator(key, object[key], onlyOnce(done));
	}
	function onlyOnce(fn) {
        var called = false;
        return function() {
            if (called) {
				throw new Error('callback was already called');
			}
            called = true;
            fn.apply(root, arguments);
        };
	}
	function done(error) {
		if(error) {
			next(error);
			next = function() {};
			return;
		}
		completed++;
		if(completed >= length) {
			next();
		}
		var called = true;
	}
};

aObject.eachSync = function(object, iterator) {
	Object.keys(object).forEach(function(key) {
		iterator(key, object[key]);
	});
};

aObject.update = function(currentObject, newObject) {
	Object.keys(newObject).forEach(function(key) {
		if(typeof newObject[key] == 'object') {
			if(typeof currentObject[key] == 'undefined') {
				currentObject[key] = {};
			}
			return aObject.update(currentObject[key], newObject[key]);
		}
		currentObject[key] = newObject[key];
	});
};

module.exports = aObject;
