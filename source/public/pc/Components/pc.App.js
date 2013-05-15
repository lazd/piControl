pc.App = F.Component.extend({
	toString: 'piControl',
	
	View: F.View.extend({
		events: {
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

		this.bind('heartbeat');
	},

	setup: function() {
		var self = this;

		this.addComponent(new pc.Actions({
			el: this.view.$('#actions')
		}));

		this.addComponent(new pc.Stats({
			el: this.view.$('#stats')
		}));
		
		/*
		this.addComponent(new pc.Terminal({
			el: this.view.$('.terminal')
		}));
		*/

		/*
		this.addComponent(new pc.Settings({
			el: this.view.$('.settings')
		}));
		*/

		this.listenTo(this.actions, 'component:shown', this.setNavState);
		this.listenTo(this.stats, 'component:shown', this.setNavState);

		var socket = io.connect('/');
		socket.on('connect', function() {
			socket.send('hai');

			socket.on('heartbeat', self.heartbeat);
		});
	},

	setNavState: function(evt) {
		this.view.$('#footer [data-section="'+evt.name+'"]').siblings().removeClass('down').end().addClass('down');
	},

	heartbeat: function(beat) {
		for (var name in this.components) {
			var component = this.components[name];

			if (component.heartbeat) {
				component.heartbeat(beat);
			}
		}
	}
});