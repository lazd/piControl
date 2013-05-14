pc.App = F.Component.extend({
	toString: 'piControl',
	
	View: F.View.extend({
		events: {
			'click #footer button': 'handleNav'
		}
	}),

	Template: pc.Templates.App,

	options: {
		singly: true
	},

	construct: function() {
		this.view = new this.View({
			component: this,
			el: this.options.el,
			template: this.Template
		});
	},

	setup: function() {
		this.addComponent(new pc.Actions({
			el: this.view.$('#actions')
		}));

		/*
		this.addComponent(new pc.Terminal({
			el: this.view.$('.terminal')
		}));
		*/

		this.addComponent(new pc.Stats({
			el: this.view.$('#stats')
		}));
		
		/*
		this.addComponent(new pc.Settings({
			el: this.view.$('.settings')
		}));
		*/

		this.listenTo(this.actions, 'component:shown', this.setNavState);
		this.listenTo(this.stats, 'component:shown', this.setNavState);
	},

	setNavState: function(evt) {
		this.view.$('#footer button[data-section="'+evt.name+'"]').siblings().removeClass('down').end().addClass('down');
	},

	handleNav: function(evt) {
		var section = $(evt.currentTarget).data('section');

		if (this.components[section]) {
			this.components[section].show();
		}
	}
});