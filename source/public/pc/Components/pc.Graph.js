pc.Graph = F.Component.extend({
	toString: 'Graph',

	options: {
		gridSections: 10,
		gridLinesSharp: true,
		gridStyle: 'rgba(119,119,119,0.36)',
		lineStyle: 'rgba(0,143,0,1)',
		fillStyle: 'rgba(0,143,0,0.30)',
		lineWidth: 2,
		minValue: 0,
		maxValue: 100,
		maxValueScale: 1,
		delay: 1000,
		height: 200
	},

	construct: function(options) {
		this.$el = $(options.el);

		this.canvas = document.createElement('canvas');
		this.canvas.width = this.$el.width();
		this.canvas.height = Math.max(this.$el.height(), this.options.height);

		this.$el.append(this.canvas);

		this.chart = new SmoothieChart({
			maxValueScale: this.options.maxValueScale,
			grid: {
				strokeStyle: this.options.gridStyle,
				sharpLines: this.options.gridLinesSharp,
				verticalSections: this.options.gridSections
			},
			labels: {
				disabled: true
			},
			minValue: this.options.minValue,
			maxValue: this.options.maxValue
		});

		this.series = new TimeSeries();

		this.chart.addTimeSeries(this.series, {
			lineWidth: this.options.lineWidth,
			strokeStyle: this.options.lineStyle,
			fillStyle: this.options.fillStyle
		});

		this.chart.streamTo(this.canvas, this.options.delay);
	},
	addPoint: function(time, point) {
		this.series.append(time, point);
	}
});
