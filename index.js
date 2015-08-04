var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//io.sockets.on('connection', function(socket) {
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    socket.emit('message', 'Hello World!');
});

http.listen(7777, function() {
    console.log('listening to 7777');
});

