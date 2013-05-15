var color = require('shellcolor');

module.exports = function(app, io) {
	var sockets = [];

	io.on('connection', function(socket) {
		var ip = socket.handshake.address.address;

		console.log(color(ip+' <grey>SOCKET</grey> <cyan>Client connected</cyan>'));

		socket.on('doAction', function (data) {
			console.log(data);
		});

		sockets.push(socket);
	});

	var heartbeats = app.set('heartbeats');

	var beat = {};

	setInterval(function() {
		if (sockets.length && heartbeats.length) {
			// Execute heartbeats
			heartbeats.forEach(function(heartbeat) {
				heartbeat(beat);
			});

			// Add time
			beat.time = new Date().getTime();

			// Emit to all sockets
			sockets.forEach(function(socket) {
				socket.emit('heartbeat', beat);
			});
		}
	}, 1000);
};
