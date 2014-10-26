function objectEach(object, iterator, next) {
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
}

function objectForEach(object, iterator) {
	Object.keys(object).forEach(function(key) {
		iterator(key, object[key]);
	});
}

module.exports = objectEach;
