var express = require('express');

var app = express();

// Store the working dir as root
app.set('root', __dirname+'/');

// Get command line configuration
app.set('port', process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

// Configuration
require('./config/app')(app);
require('./config/routes')(app);
require('./config/modules')(app);

// Start server
var port = app.set('port');
app.listen(port);

console.log('piControl listening on on port %d', port);
