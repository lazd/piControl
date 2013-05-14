pc.Collections.Actions = Backbone.Collection.extend({
	url: '/api/actions',
	parse: function(response) {
		return response.body;
	}
});
