module.exports = function(app) {
	app.get('/api/modules', function(req, res) {
		res.setHeader('Content-Type', 'application/json');

		res.json({
			status: 0,
			body: app.set('moduleInfo')
		});
	});

	app.get('/pc/pc.modules.js', function(req, res) {
		res.setHeader('Content-Type', 'text/javascript');

		res.end(app.set('moduleJS'));
	});

	app.get('/api/actions', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.json({
			status: 0,
			body: app.set('actions')
		});
	});
};
