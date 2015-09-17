var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//var playerIds = [];
//var playerSockets = [];

var playerData = []; // contains: var player = {playerId: id, playerSocket: socket, playerName: name, playerKills: kills, playerDeaths: deaths};

var statsData = []; // contains: var data = {playerName: name, playerKills: kills, playerDeaths: deaths};

var presentWreckages = [];
// contains: var wreckage = {wreckId:, playerName:, killerName:, wreckX:, wreckY:, wreckZ:};

//io.sockets.on('connection', function(socket) {
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    
    var id = "";
    id += generateId();
    
    console.log('generated id ' + id + ' for player');
    
    // Create player in player list
    var player = {playerId: id, playerSocket: socket, playerName: "-", playerKills: 0, playerDeaths: 0};
    playerData.push(player);
    
    socket.emit('connected', {playerId: id});
    
    //Send present wreckages
    for(var i = 0; i < presentWreckages.length; i++) {
        // send these as wreckageinputs or something else
        socket.emit('Death', presentWreckages[i]);
    }
    
    //Send current players and statistics
    // ToBeDone
    
    socket.on('disconnect', function() {
        console.log('player ' + getIdBySocket(socket) + " disconnected");
        io.emit('DeletePlayer', {playerId: getIdBySocket(socket)});
        deletePlayer(socket);
    });
    
    socket.on('PlayerName', function(data) {
        addNameToPlayer(socket, data.playerName);
        
        // send statistics
        for(var i = 0; i < playerData.length; i++) {
            io.emit('StatsData', {playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
        }
    });
    
    socket.on('Hello', function(data) { // Dummy test function
        console.log('got a hello');
        console.log("got float: " + data.field1 + " and string: " + data.field2);
        socket.emit("Reply");
    });
    
    socket.on('Launch', function(data) {
        console.log('Firing... '  + getIdBySocket(socket));
        io.emit('Launch', data);
    });
    
    socket.on('Explosion', function(data) {
        //console.log('Explosion... ' + data.x + ' ' + data.y + ' ' + data.z);
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
        
        var wreckId = "";
        wreckId += generateId();
        
        console.log('Player ' + getNameByPlayerId(data.killer) + ' destroyed player ' + getNameByPlayerId(data.player));
        addKillToPlayer(data.killer);
        addDeathToPlayer(data.player);
        //logPlayerData();
        
        // send statistics
        for(var i = 0; i < playerData.length; i++) {
            io.emit('StatsData', {playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
        }
        
        var wreckage = {wreckId: wreckId, playerName: getNameByPlayerId(data.player), killerName: getNameByPlayerId(data.killer), wreckX: data.x, wreckY: data.y, wreckZ: data.z};
        presentWreckages.push(wreckage);
        
        io.emit('Death', wreckage);
    });
    
    socket.on('RemoveWreck', function(data) {
        console.log('Wreck removed... ' + data.wreckId);
        io.emit('RemoveWreck', data);
        deleteWreck(data.wreckId);
    });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 7777
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// can listen just by port too..
http.listen(server_port, server_ip_address,  function() {
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

// add kill to player
function addKillToPlayer(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            playerData[i].playerKills++;
            return;
        }
    }
}

// add death to player
function addDeathToPlayer(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            playerData[i].playerDeaths++;
            return;
        }
    }
}

// get socket by player id
function getSocketByPlayerId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            return playerData[i].playerSocket;
        }
    }
    return null;
}

// get name by player id
function getNameByPlayerId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            return playerData[i].playerName;
        }
    }
    return null;
}

// get player id by socket
function getIdBySocket(socket) {
    for(var i = 0; i < playerData.length; i++) {
        if(socket == playerData[i].playerSocket) {
            return playerData[i].playerId;
        }
    }
    
    return null;
}

// add player a name
function addNameToPlayer(socket, name) {
    for(var i = 0; i < playerData.length; i++) {
        if(socket == playerData[i].playerSocket) {
            playerData[i].playerName = name;
            return;
        }
    }
}

// remove player from connected players list
function deletePlayer(socket) {
    var indexToRemove = -1;
    for(var i = 0; i < playerData.length; i++) {
        if(socket == playerData[i].playerSocket) {
            indexToRemove = i;
        }
    }
    
    if(indexToRemove > -1) {
        playerData.splice(indexToRemove,1);
    }    
}

// check if generated id exists
function checkIfUniqueId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) return false;
    }
    for(var i = 0; i < presentWreckages.length; i++) {
        if(id == presentWreckages[i].wreckId) return false;
    }
    return true;
}

// remove wreck from wreck list
function deleteWreck(wreckId) {
    var indexToRemove = -1;
    for(var i = 0; i < presentWreckages.length; i++) {
        if(wreckId == presentWreckages[i].wreckId) {
            indexToRemove = i;
        }
    }
    
    if(indexToRemove > -1) {
        presentWreckages.splice(indexToRemove,1);
    }    
}

// generate stats table
function makeStatsData() {
    statsData.splice(0,statsData.length);
    for(var i = 0; i < playerData.length; i++) {
        statsData.push({playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
    }
}

// list playerData list (all connected players)
function logPlayerData() {
    console.log("players: " + playerData.length);
    for(var i = 0; i < playerData.length; i++) {
        console.log("id: " + playerData[i].playerId + " name:" + playerData[i].playerName + " socket:" + playerData[i].playerSocket + " kills:" + playerData[i].playerKills + " deaths:"  + playerData[i].playerDeaths);
    }
}

// list presentWreckages list (all present wrecks)
function logWreckages() {
    console.log("wrecks: " + presentWreckages.length);
    for(var i = 0; i < presentWreckages.length; i++) {
        console.log("id: " + presentWreckages[i].wreckId + " x:" + presentWreckages[i].wreckX + " y:" + presentWreckages[i].wreckY + " z:" + presentWreckages[i].wreckZ);
    }
}