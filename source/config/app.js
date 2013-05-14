var express		= require('express');
var hbs			= require('hbs');

module.exports = function(app) {
	// Configure hbs
	app.configure(function() {
		app.set('views', app.set('root')+'templates/');
		app.set('view engine', 'hbs');
		
		/*
		// Register partials and store compild templates
		var compiled = {};
		// var partials = require('../lib/partials')(app);
		for (var partial in partials) {
			compiled[partial] = hbs.compile(partials[partial]);
			hbs.registerPartial(partial, compiled[partial]);
		}
		
		// Add helpers
		require('../../shared/Handlebars.helpers')(hbs);
		
		app.set('templates', compiled);
		*/
	});
	// Configure expressjs
	app.configure(function() {
		this
			// .use(express.favicon(app.set('clientPath')+'/images/favicon.ico')) // Stay out of the logs, favicon!
			.use(express.logger(':remote-addr \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'))
			.use(express.bodyParser())
			.use(express.cookieParser('piCookieSecret'))
			.use(express.session({
				secret: 'piSessionSecret'
			}))
			.use(express.errorHandler({ dumpException: true, showStack: true }))
			.use(express.static(app.set('root')+'public/'));
	});
};
