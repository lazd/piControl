var color = require('shellcolor');

function log(socket, message) {
	var args = Array.prototype.slice.call(arguments, 2);
	args.unshift(color(socket.ip+' <grey>SOCKET</grey> <cyan>'+message+'</cyan>'));
	console.log.apply(console, args);
}

function handleAction(action, socket) {
	log(socket, 'Perform action:', action);
}

module.exports = function(app, io) {
	var sockets = [];

	io.on('connection', function(socket) {
		// Store IP
		socket.ip = socket.handshake.address.address;
		log(socket, 'Client connected');

		// Listen for actions
		socket.on('doAction', function(action) {
			handleAction(action, socket);
		});

		// Store a reference to this socket
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
