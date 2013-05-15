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
	},

	heartbeat: function(beat) {
		if (!this.isVisible()) return;

		var cpuPercent = beat.cpu.usagePercent*100;
		var memoryPercent = beat.memory.usagePercent*100;

		this.$cpuPercent.text(cpuPercent.toFixed(1)+'%');
		this.$memoryPercent.text(pc.util.getFileSizeString(beat.memory.used)+' ('+memoryPercent.toFixed(1)+'%)');

		this.cpuGraph.addPoint(beat.time, cpuPercent);
		this.memoryGraph.addPoint(beat.time, memoryPercent);
	}
});