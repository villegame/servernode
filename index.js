var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var playerIds = [];

//io.sockets.on('connection', function(socket) {
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    
    var id = "";
    id += generateId();
    playerIds.push(id);
    console.log('generated id "' + id + '" for player');
    
    socket.emit('connected', {playerId: id});
    
    socket.on('disconnect', function() {
        console.log('client disconnected');
    });
    
    socket.on('Hello', function(data) {
        console.log('got a hello');
        console.log("got float: " + data.field1 + " and string: " + data.field2);
        socket.emit("Reply");
    });
    
    socket.on('Launch', function(data) {
        console.log('Firing...');
        io.emit('Launch', data);
    });
    
    socket.on('Explosion', function(data) {
        console.log('Explosion...');
        io.emit('Explosion', data);
    });
    
    socket.on('Death', function(data) {
        console.log('Death...');
        io.emit('Death', data);
    });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 80
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// can listen just by port too..
//http.listen(server_port, server_ip_address, function() {
http.listen(server_port, function() {
    console.log('listening to ' + server_ip_address + ":" + server_port);
});

// Generate random Id
function generateId()
{
    var id;
    //= "";
    do {
        id = "";
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 10; i++ )
            id += chars.charAt(Math.floor(Math.random() * chars.length));

    }
    while(!checkIfUniqueId(id))
    return id;
}

function checkIfUniqueId(id) {
    for(var i = 0; i < playerIds.length; i++) {
        if(id == playerIds[i]) return false;
    }
    return true;
}
