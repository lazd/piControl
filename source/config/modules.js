var fs = require('fs');

module.exports = function(app, io) {
	var modules = [];

	// Get list of all default modules
	fs.readdirSync(app.set('root')+'modules').forEach(function(file) {
		modules.push(require(app.set('root')+'modules/' + file)(app));
	});

	// Get list of all user modules
	// TODO: Define folder, get stuff from it

	var heartbeats = app.set('heartbeats');

	// Add interfaces for each module
	modules.forEach(function(module, index) {
		// Add heartbeats
		if (module.heartbeat) {
			console.log('Adding heartbeat for: %s', module.name);
			heartbeats.push(module.heartbeat);
		}

		// Add routes
		if (module.routes) {
			console.log('Adding module: %s', module.name);
			module.routes.forEach(function(route) {
				console.log('Adding route: %s %s', route.method, route.url);

				// Get the hanlder
				var handler;
				if (typeof route.handler === 'function')
					handler = route.handler;
				else if (typeof route.handler === 'string')
					handler = module[route.handler];
				else {
					throw new Error('Module %s specified invalid handler for route %s %s', module.name, route.method, route.url);
				}

				// Set the route
				app[route.method](route.url, handler);
			});
		}
	});
};
