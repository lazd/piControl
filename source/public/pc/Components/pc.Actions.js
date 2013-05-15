pc.Actions = F.ListComponent.extend({
	toString: 'actions',

	ItemTemplate: pc.Templates.ActionItem,

	Collection: pc.Collections.Actions,

	construct: function() {
		// Store a reference to the socket
		this.socket = this.options.socket;

		// Listen for clicks on list items
		this.listenTo(this, 'list:itemSelected', this.handleActionClicked);
	},

	handleActionClicked: function(evt) {
		var model = evt.model;

		console.log('Should perform action %s', model.get('name'));
		this.socket.emit('doAction', model.toJSON());
	}
});
