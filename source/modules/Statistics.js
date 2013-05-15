var os = require("os");

function getCPUInfo(callback) {
	var cpus = os.cpus();

	var cpuTime = 0;
	var idle = 0;

	cpus.forEach(function(cpu) {
		cpuTime += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
		idle += cpu.times.idle;
	});

	return {
		time: new Date().getTime(),
		cpus: cpus.length,
		idle: idle,
		cpuTime: cpuTime
	};
}

function getCPUUsage(callback) {
	var sampleTime = 1000;

	var cpuInfo_before = getCPUInfo();

	setTimeout(function() {
		var cpuInfo_now = getCPUInfo();
		var total = cpuInfo_now.cpuTime/10 - cpuInfo_before.cpuTime/10;
		var elapsed = (cpuInfo_now.time - cpuInfo_before.time);
		var usagePercent = total / cpuInfo_now.cpus / elapsed;

		callback(usagePercent);
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
				res.json({
					status: 0,
					time: new Date().getTime(),
					body: cpuInfo
				});
			}
		},
		{
			url: '/api/stats/memory',
			method: 'get',
			handler: function(req, res, next) {
				res.json({
					status: 0,
					time: new Date().getTime(),
					body: memoryInfo
				});
			}
		}
	],

	heartbeat: function(beat) {
		beat.cpu = cpuInfo;
		beat.memory = memoryInfo;
	},

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
			usagePercent: percent
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

// Store memory and CPU usage info
var memoryInfo;
var cpuInfo = {
	usagePercent: 0
};

module.exports = function(_app, _io) {
	// Get the cpu and memory usage
	var update = function() {
		memoryInfo = Statistics.getMemory();

		getCPUUsage(function(usagePercent) {
			cpuInfo = {
				usagePercent: usagePercent
			};
		});
	};

	// Get the CPU usage every second
	update();
	setInterval(update, 1000);

	return Statistics;
};
