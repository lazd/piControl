var fs = require('fs');
var Handlebars = require('handlebars');

module.exports = function(app, io) {
	var modulesPath = app.set('root')+'modules/';
	var moduleInfo = [];
	var serverModules = [];
	var moduleJS = '';

	// Get list of all default modules
	fs.readdirSync(modulesPath).forEach(function(module) {
		var modulePath = modulesPath+module+'/';
		var serverModulePath = modulePath+'server/index.js';
		var clientModulePath = modulePath+'client/index.js';
		var templatesPath = modulePath+'templates/';
		var moduleJSONPath = modulePath+'module.json';

		// Get module information
		var moduleJSON = JSON.parse(fs.readFileSync(moduleJSONPath, { encoding: 'utf8' }));
		moduleInfo.push(moduleJSON);

		// Include server-side module
		if (fs.existsSync(serverModulePath)) {
			// Pass the app and the soket.io instance
			serverModules.push(require(serverModulePath)(app, io));
		}

		// Include client-side module
		if (fs.existsSync(clientModulePath)) {
			// Add JS
			var curModuleJS = fs.readFileSync(clientModulePath);

			// Add templates
			fs.readdirSync(templatesPath).forEach(function(templateFileName) {
				var templateName = templateFileName.replace(/.hbs$/, '');
				var contents = fs.readFileSync(templatesPath+templateFileName, { encoding: 'utf8' });
				var templateJS = 'pc.Templates['+JSON.stringify(templateName)+'] = Handlebars.template('+Handlebars.precompile(Handlebars.parse(contents))+');';
			
				console.log(templateJS);

				moduleJS += templateJS;
			});

			moduleJS += curModuleJS;
		}
	});

	// Store client module information
	app.set('moduleJS', moduleJS);
	app.set('moduleInfo', moduleInfo);

	// Add interfaces for each module
	var heartbeats = app.set('heartbeats');
	serverModules.forEach(function(module, index) {
		console.log('Adding module: %s', module.name);

		// Add heartbeats
		if (module.heartbeat) {
			console.log('Adding heartbeat for: %s', module.name);
			heartbeats.push(module.heartbeat);
		}

		// Add routes
		if (module.routes) {
			module.routes.forEach(function(route) {
				console.log('Adding route: %s %s', route.method, route.url);

				// Get the hanlder
				var handler;
				if (typeof route.handler === 'function') {
					handler = route.handler;
				}
				else if (typeof route.handler === 'string') {
					handler = module[route.handler];
				}
				else {
					throw new Error('Module %s specified invalid handler for route %s %s', module.name, route.method, route.url);
				}

				// Set the route
				app[route.method](route.url, handler);
			});
		}
	});
};
