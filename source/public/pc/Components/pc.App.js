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

		// Connect to the socket
		var socket = this.socket = io.connect('/');
		socket.on('connect', function() {
			socket.on('heartbeat', self.heartbeat);
		});

		// Add actions component
		this.addComponent(new pc.Actions({
			el: this.view.$('#actions'),
			socket: this.socket
		}));

		// Select the footer button when shown
		this.listenTo(this.actions, 'component:shown', this.setNavState);

		// Fetch modules
		$.ajax('/api/modules', {
			success: function(response) {
				response.body.forEach(function(moduleInfo) {
					self.addModule(moduleInfo);
				});

				Backbone.history.start();
			}
		});
	},

	addModule: function(moduleInfo) {
		var moduleFunc = pc.util.get(moduleInfo.clientModule);
		var shortName = moduleInfo.label.toLowerCase();

		if (moduleFunc) {
			// Create a container for the component
			var container = $('<div/>').appendTo(this.view.$('#content'));

			// Create the instance and add the component
			var component = this.addComponent(new moduleFunc({
				el: container,
				socket: this.socket
			}), shortName);

			if (moduleInfo.icon) {
				// Add footer button
				this.view.$('#footer').append('<a class="button" data-section="'+shortName+'" href="#'+shortName+'"><i class="'+moduleInfo.icon+'"></i>'+moduleInfo.label+'</a>');

				// Select the footer button when shown
				this.listenTo(component, 'component:shown', this.setNavState);
			}
		}
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