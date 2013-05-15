module.exports = function(app) {
	var actions = [
		{
			name: 'Restart'
		}
	];

	// Store in app
	app.set('actions', actions);
};
