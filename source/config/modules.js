var fs = require('fs');
var Handlebars = require('handlebars');

module.exports = function(app, io) {
	var heartbeats = app.set('heartbeats');
	var actions = app.set('actions');
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

		console.log('Adding module: %s', moduleJSON.name);

		// Add actions
		if (moduleJSON.actions) {
			console.log('Adding %d actions...', moduleJSON.actions.length);
			actions.concat(moduleJSON.actions);
		}

		// Include server-side module
		if (fs.existsSync(serverModulePath)) {
			console.log('Adding server side module...');
			// Pass the app and the soket.io instance
			var moduleInstance = require(serverModulePath)(app, io);

			// Add heartbeats
			if (moduleInstance.heartbeat) {
				console.log('Adding heartbeat...');
				heartbeats.push(moduleInstance.heartbeat);
			}

			// Add routes
			if (moduleInstance.routes) {
				moduleInstance.routes.forEach(function(route) {
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
						throw new Error('Module %s specified invalid handler for route %s %s', moduleInstance.name, route.method, route.url);
					}

					// Set the route
					app[route.method](route.url, handler);
				});
			}
		}

		// Include client-side module
		if (fs.existsSync(clientModulePath)) {
			console.log('Adding client side module...');

			// Add JS
			var curModuleJS = fs.readFileSync(clientModulePath);

			// Add templates
			fs.readdirSync(templatesPath).forEach(function(templateFileName) {
				var templateName = templateFileName.replace(/.hbs$/, '');
				console.log('Adding template %s...', templateName);

				var contents = fs.readFileSync(templatesPath+templateFileName, { encoding: 'utf8' });
				var templateJS = 'pc.Templates['+JSON.stringify(templateName)+'] = Handlebars.template('+Handlebars.precompile(Handlebars.parse(contents))+');';
			
				moduleJS += templateJS;
			});

			moduleJS += curModuleJS;
		}
	});

	// Store client module information
	app.set('moduleJS', moduleJS);
	app.set('moduleInfo', moduleInfo);
};
