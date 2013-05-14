pc.Stats = F.Component.extend({
	toString: 'Stats',
	
	View: F.View,

	Template: pc.Templates.Stats,

	options: {
		interval: 1000
	},

	construct: function() {
		this.view = new this.View({
			component: this,
			el: this.options.el,
			template: this.Template
		});

		this.bind('getData');
	},
	setup: function() {
		this.addComponent(new pc.Graph({
			el: this.view.$('.cpuGraph')
		}), 'cpuGraph');

		this.addComponent(new pc.Graph({
			el: this.view.$('.memoryGraph'),
			maxValue: undefined,
			minValue: 0
		}), 'memoryGraph');

		this.interval = setInterval(this.getData, this.options.interval);
		this.getData();
	},
	teardown: function() {
		clearInterval(this.interval);
	},
	getData: function() {
		var self = this;
		$.ajax('/api/stats/load', {
			success: function(response) {
				self.cpuGraph.addPoint(response.body.time, response.body.usage*100);
			}
		});
		$.ajax('/api/stats/memory', {
			success: function(response) {
				if (!self.totalMemory) {
					self.totalMemory = response.body.total;
					self.memoryGraph.series.maxValue = self.totalMemory;
				}

				self.memoryGraph.addPoint(response.body.time, response.body.total-response.body.free);
			}
		});
	}
	
});