pc.Actions = F.ListComponent.extend({
	toString: 'actions',

	ItemTemplate: pc.Templates.ActionItem,

	Collection: pc.Collections.Actions,

	construct: function() {
		this.listenTo(this, 'list:itemSelected', this.handleActionClicked);
	},

	handleActionClicked: function(evt) {
		var model = evt.model;

		console.log('Should perform action %s', model.get('name'));
	}
});
