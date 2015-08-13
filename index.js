var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//io.sockets.on('connection', function(socket) {
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    socket.emit('connected', {name: "dataman", more: "more data"});
    
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
    
    socket.on('Hello', function(data) {
        console.log('got a hello');
        console.log("got float: " + data.field1 + " and string: " + data.field2);
        socket.emit("Reply");
    });
    
    socket.on('Shoot', function(data) {
        console.log('Shooting...');
        io.emit('Shoot', data);
    });
});

http.listen(7777, function() {
    console.log('listening to 7777');
});

