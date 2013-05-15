var pc = {
	Models: {},
	Collections: {},
	Templates: {},
	init: function() {
		pc.router = new pc.Router();
		pc.app = new pc.App({
			el: 'body',
			visible: true
		});

		// Normally, we'd start history here.
		// In this case, we're fetching a list of components to add
		// so don't start the router until modules are added
		// Backbone.history.start();
	}
};
