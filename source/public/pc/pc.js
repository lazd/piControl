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

		Backbone.history.start();
	}
};
