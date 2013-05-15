module.exports = function(app) {
	app.get('/api/actions', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.json({
			status: 0,
			body: [
				{
					name: 'Restart',
					method: 'post',
					url: '/api/actions/restart'
				}
			]
		});
	});
};
