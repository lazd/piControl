var app = require('express')();
var server = require('http').createServer(app);
var socket = require('socket.io');

// Store the working dir as root
app.set('root', __dirname+'/');

// Get command line configuration
app.set('port', process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

// Configuration
require('./config/app')(app);
require('./config/routes')(app);

// Start HTTP server
var port = app.set('port');
server.listen(port);
console.log('piControl listening on on port %d', port);

// Start socket server
var io = socket.listen(server, { log: false });
require('./config/socketEvents')(app, io);

// Include modules
require('./config/modules')(app, io);
