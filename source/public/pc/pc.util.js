pc.util = {};

/*
	Get a short file size from the file size in bytes
*/
pc.util.getFileSizeString = function(fileSizeInBytes) {
	var i = -1;
	var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
	do {
		fileSizeInBytes = fileSizeInBytes / 1024;
		i++;
	} while (fileSizeInBytes > 1024);

	return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

/**
	Get the a property of an object using dot notiation
	
	@param {Object} object		Optional object to get the property of.
	@param {String} prop		Proprety to Get
	
	@todo add push option to always push to an array
	
	@returns {Object}	Object the property was set on or the created object
 */
pc.util.get = function(prop) {
	var propParts = prop.split('.');
	
	if (propParts.length > 1) {
		var curObj = window;
		for (var i = 0; i < propParts.length; i++) {
			var part = propParts[i];
			if (i === propParts.length-1) {
				return curObj[part];
			}
			else {
				curObj = curObj[part]; // Drill inward
			}
		}
	}

	return null;
};
