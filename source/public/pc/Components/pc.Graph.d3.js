pc.Graph = F.Component.extend({
	toString: 'Graph',

	construct: function(options) {
		this.$el = $(options.el);
		this.el = this.$el[0];

		var n = 60,
			random = d3.random.normal(0, 0.2),
			data = this.data = d3.range(n).map(function() { return 0; });

		var margin = {top: 10, right: 10, bottom: 20, left: 40},
			width = this.$el.innerWidth(),
			height = Math.max(this.$el.height(), 200);

		var x = this.x = d3.scale.linear()
			.domain([0, n - 1])
			.range([0, width]);

		var y = this.y = d3.scale.linear()
			.domain([-8, 100])
			.range([height, 0]);

		var line = this.line = d3.svg.line()
			.x(function(d, i) { return x(i); })
			.y(function(d, i) { return y(d); });

		var svg = this.svg = d3.select(this.el).append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.svg.axis().scale(x).orient("bottom"));

		svg.append("g")
			.attr("class", "y axis")
			.call(d3.svg.axis().scale(y).orient("left"));

		var path = this.path = svg.append("g")
			.attr("clip-path", "url(#clip)")
			.append("path")
			.data([data])
			.attr("class", "line")
			.attr("d", line);
	},
	addPoint: function(point) {
		// push a new data point onto the back
		this.data.push(point);

		var now = (new Date()).getTime();
		var time;
		if (this.last)
			time = now - this.last;
		else
			time = 0;
		
		// redraw the line, and slide it to the left
		this.path
			.attr("d", this.line)
			.attr("transform", null)
			.transition()
			.duration(time)
			.ease("linear")
			.attr("transform", "translate(" + this.x(-1) + ")");
		
		// pop the old data point off the front
		this.data.shift();

		this.last = now;
	}
});
