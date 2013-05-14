var os = require("os");

function getCPUInfo(callback) {
	var cpus = os.cpus();

	var user = 0;
	var nice = 0;
	var sys = 0;
	var idle = 0;
	var irq = 0;

	for(var cpu in cpus){
		user += cpus[cpu].times.user;
		nice += cpus[cpu].times.nice;
		sys += cpus[cpu].times.sys;
		irq += cpus[cpu].times.irq;
		idle += cpus[cpu].times.idle;
	}

	var total = user + nice + sys + idle + irq;

	return {
		'idle': idle, 
		'total': total
	};
}

function getCPUUsage(callback) {
	var stats1 = getCPUInfo();
	var startIdle = stats1.idle;
	var startTotal = stats1.total;

	setTimeout(function() {
		var stats2 = getCPUInfo();
		var endIdle = stats2.idle;
		var endTotal = stats2.total;

		var idle = endIdle - startIdle;
		var total = endTotal - startTotal;
		var perc = idle / total;

		callback(perc);
	}, 1000 );
}

var Statistics = {
	name: 'Statistics',

	// label: 'Stats',
	// icon: 'icon-bar-chart',
	// template: 'Stats',

	routes: [
		{
			url: '/api/stats',
			method: 'get',
			handler: function(req, res, next) {
				res.json({
					status: 0,
					body: Statistics.getStats()
				});
			}
		},
		{
			url: '/api/stats/load',
			method: 'get',
			handler: function(req, res, next) {
				getCPUUsage(function(percent) {
					res.json({
						status: 0,
						body: {
							time: new Date().getTime(),
							usage: percent
						}
					});
				});
			}
		},
		{
			url: '/api/stats/memory',
			method: 'get',
			handler: function(req, res, next) {
				var memory = Statistics.getMemory();
				memory.time = new Date().getTime();
				res.json({
					status: 0,
					body: memory
				});
			}
		}
	],

	getLoad: function() {
		return os.loadavg();
	},
	getMemory: function() {
		return {
			free: os.freemem(),
			total: os.totalmem()
		};
	},

	getStats: function() {
		var info = {};

		// Uptime
		info.uptime = os.uptime();

		// Memory
		info.memory = this.getMemory();

		// Load
		info.load = this.getLoad();

		// Hostname
		info.hostname = os.hostname();

		// Network
		info.network = os.networkInterfaces();

		return info;
	}
};

var app;
module.exports = function(_app) {
	app = _app;
	return Statistics;
};
