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
			el: this.view.$('.cpuGraph'),
			maxValue: 100,
			minValue: 0
		}), 'cpuGraph');

		this.addComponent(new pc.Graph({
			el: this.view.$('.memoryGraph'),
			maxValue: 100,
			minValue: 0
		}), 'memoryGraph');

		this.$cpuPercent = this.view.$('.cpuPercent');
		this.$memoryPercent = this.view.$('.memoryPercent');

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
				var percent = response.body.percent*100;

				self.$cpuPercent.text(percent.toFixed(1)+'%');

				self.cpuGraph.addPoint(response.time, percent);
			}
		});
		$.ajax('/api/stats/memory', {
			success: function(response) {
				var percent = response.body.percent*100;

				self.$memoryPercent.text(percent.toFixed(1)+'%');

				self.memoryGraph.addPoint(response.time, percent);
			}
		});
	}
	
});