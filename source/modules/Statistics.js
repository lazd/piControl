var os = require("os");

function getCPUInfo(callback) {
	var cpus = os.cpus();

	var user = 0;
	var nice = 0;
	var sys = 0;
	var idle = 0;
	var irq = 0;

	cpus.forEach(function(cpu) {
		user += cpu.times.user;
		nice += cpu.times.nice;
		sys += cpu.times.sys;
		irq += cpu.times.irq;
		idle += cpu.times.idle;
	});

	var total = user + nice + sys + irq;

	return {
		'cpus': cpus.length,
		'idle': idle, 
		'working': total
	};
}

function getCPUUsage(callback) {
	var sampleTime = 1000;

	var cpuInfo_before = getCPUInfo();

	setTimeout(function() {
		var cpuInfo_now = getCPUInfo();
		var total = cpuInfo_now.working/10 - cpuInfo_before.working/10;
		var pct = total / cpuInfo_now.cpus / sampleTime;

		console.log(total);
		console.log('CPU: %sms, %s', total.toFixed(2), pct.toFixed(2));

		callback(pct);
	}, sampleTime);
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
						time: new Date().getTime(),
						body: {
							percent: percent
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
					time: new Date().getTime(),
					body: memory
				});
			}
		}
	],

	getLoad: function() {
		return os.loadavg();
	},
	getMemory: function() {
		var totalMem = os.totalmem();
		var freeMem = os.freemem();
		var used = totalMem-freeMem;
		var percent = used/totalMem;
		return {
			used: used,
			total: totalMem,
			percent: percent
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
