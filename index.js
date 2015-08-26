var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var playerIds = [];
var playerSockets = [];

//io.sockets.on('connection', function(socket) {
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    
    var id = "";
    id += generateId();
    
    // this should be done better, so far the list indexes should match player id to socket
    playerIds.push(id);
    playerSockets.push(socket);
    
    console.log('generated id "' + id + '" for player');
    
    socket.emit('connected', {playerId: id});
    
    socket.on('disconnect', function() {
        console.log('client disconnected');
        // TODO: update playerid and playersockets lists !!!
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
    
    socket.on('RadarScan', function(data) {
        console.log('RadarScan...');
        io.emit('RadarScan', data);
    });
    
    socket.on('RadarReply', function(data) {
        console.log('RadarReply...');
        var tmpSocket = getSocketByPlayerId(data.player);
        tmpSocket.emit('RadarReply', data);
    });
    
    socket.on('Death', function(data) {
        console.log('Death...');
        io.emit('Death', data);
    });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 7777
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// can listen just by port too..
http.listen(server_port, function() {
//http.listen(server_port, function() {
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

// get socket by player id
function getSocketByPlayerId(id) {
    for(var i = 0; i < playerIds.length; i++) {
        if(id == playerIds[i]) {
            return playerSockets[i];
        }
    }
}

function checkIfUniqueId(id) {
    for(var i = 0; i < playerIds.length; i++) {
        if(id == playerIds[i]) return false;
    }
    return true;
}
