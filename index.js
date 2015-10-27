var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Player data
// contains: var player = {playerId: id, playerSocket: socket, playerName: name, playerKills: kills, playerDeaths: deaths};
var playerData = []; 

// Game statistics data
// contains: var data = {playerName: name, playerKills: kills, playerDeaths: deaths};
var statsData = []; 

// Present wreckage positions on game area
// contains: var wreckage = {wreckId:, playerName:, killerName:, wreckX:, wreckY:, wreckZ:};
var presentWreckages = [];

//////////////////////////////////////////
//
// MESSAGE HANDLING:
//

// New connection
io.on('connection', function(socket) {
    console.log('client connected, sending message...');
    
    var id = "";
    id += generateId();
    
    console.log('generated id ' + id + ' for player');
    
    // Create player and put it in player list
    var player = {playerId: id, playerSocket: socket, playerName: "-", playerKills: 0, playerDeaths: 0};
    playerData.push(player);
    
    // Emit generated player id for player
    socket.emit('connected', {playerId: id});
    
    //Send present wreckages to new player
    for(var i = 0; i < presentWreckages.length; i++) {
        // Send wreckage as death (death message enters wreckage on client)
        socket.emit('Death', presentWreckages[i]);
    }
    
    // Player sends player name
    socket.on('PlayerName', function(data) {
        addNameToPlayer(socket, data.playerName);        
        // As response to name send statistics
        for(var i = 0; i < playerData.length; i++) {
            io.emit('StatsData', {playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
        }
    });
    
    // Weapon launch message
    socket.on('Launch', function(data) {
        console.log('Firing... '  + getIdBySocket(socket));
        io.emit('Launch', data);
    });
    
    // Incoming weapon explosion (shooting player sends, server broadcasts to everyone)
    socket.on('Explosion', function(data) {
        io.emit('Explosion', data);
    });
    
    // Client sent scan message, broadcast to everyone
    socket.on('RadarScan', function(data) {
        console.log('RadarScan...');
        io.emit('RadarScan', data);
    });
    
    // Client that was hit by radar scan, returns message to scanning player
    socket.on('RadarReply', function(data) {
        console.log('RadarReply...');
        var tmpSocket = getSocketByPlayerId(data.player);
        tmpSocket.emit('RadarReply', data);
    });
    
    // Client sent death message (player died)
    socket.on('Death', function(data) {
        console.log('Death...');
        
        // Generate wreck id
        var wreckId = "";
        wreckId += generateId();
        
        console.log('Player ' + getNameByPlayerId(data.killer) + ' destroyed player ' + getNameByPlayerId(data.player));
        
        // Update player statistics by adding kill and death
        addKillToPlayer(data.killer);
        addDeathToPlayer(data.player);
        
        // Send new statistics to everyone
        for(var i = 0; i < playerData.length; i++) {
            io.emit('StatsData', {playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
        }
        
        // Create wreckage item and add it to wreckage list
        var wreckage = {wreckId: wreckId, playerName: getNameByPlayerId(data.player), killerName: getNameByPlayerId(data.killer), wreckX: data.x, wreckY: data.y, wreckZ: data.z};
        presentWreckages.push(wreckage);
        
        // Emit death message for all clients
        io.emit('Death', wreckage);
    });
    
    // Client removed wreck
    socket.on('RemoveWreck', function(data) {
        console.log('Wreck removed... ' + data.wreckId);
        // Broadcast wreck remove
        io.emit('RemoveWreck', data);
        // Delete wreck from wreck list
        deleteWreck(data.wreckId);
    });
    
    // Player disconnected
    socket.on('disconnect', function() {
        console.log('player ' + getIdBySocket(socket) + " disconnected");
        // Send delete player to other clients
        io.emit('DeletePlayer', {playerId: getIdBySocket(socket)});
        // Delete pleyer from player list by socket
        deletePlayer(socket);
    });
    
    // Dummy test function
    socket.on('Hello', function(data) {
        console.log('got a hello');
        console.log("got float: " + data.field1 + " and string: " + data.field2);
        socket.emit("Reply");
    });
});

//////////////////////////////////////////
//
// SERVER LISTENER:
//

// Variables for openshift service
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 7777
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// Can listen just by port too as commented, ip required by openshift
http.listen(server_port, server_ip_address,  function() {
//http.listen(server_port, function() {
    console.log('listening to ' + server_ip_address + ":" + server_port);
});

//////////////////////////////////////////
//
// FUNCTIONS:
//

// Generate unique, random Id
function generateId()
{
    var id;
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    do {
        id = "";
        for( var i=0; i < 10; i++ )
            id += chars.charAt(Math.floor(Math.random() * chars.length));

    }
    while(!checkIfUniqueId(id))
    return id;
}

// Add kill to player
function addKillToPlayer(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            playerData[i].playerKills++;
            return;
        }
    }
}

// Add death to player
function addDeathToPlayer(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            playerData[i].playerDeaths++;
            return;
        }
    }
}

// Get socket by player id
function getSocketByPlayerId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            return playerData[i].playerSocket;
        }
    }
    return null;
}

// Get name by player id
function getNameByPlayerId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) {
            return playerData[i].playerName;
        }
    }
    return null;
}

// Get player id by socket
function getIdBySocket(socket) {
    for(var i = 0; i < playerData.length; i++) {
        if(socket == playerData[i].playerSocket) {
            return playerData[i].playerId;
        }
    }    
    return null;
}

// Add player a name
function addNameToPlayer(socket, name) {
    for(var i = 0; i < playerData.length; i++) {
        if(socket == playerData[i].playerSocket) {
            playerData[i].playerName = name;
            return;
        }
    }
}

// Remove player from connected players list
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

// Check if generated id exists
function checkIfUniqueId(id) {
    for(var i = 0; i < playerData.length; i++) {
        if(id == playerData[i].playerId) return false;
    }
    for(var i = 0; i < presentWreckages.length; i++) {
        if(id == presentWreckages[i].wreckId) return false;
    }
    return true;
}

// Remove wreck from wreck list
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

// Generate stats table
function makeStatsData() {
    statsData.splice(0,statsData.length);
    for(var i = 0; i < playerData.length; i++) {
        statsData.push({playerId: playerData[i].playerId, playerName: playerData[i].playerName, playerKills: playerData[i].playerKills, playerDeaths: playerData[i].playerDeaths});
    }
}

// List playerData list (all connected players), only server console output
function logPlayerData() {
    console.log("players: " + playerData.length);
    for(var i = 0; i < playerData.length; i++) {
        console.log("id: " + playerData[i].playerId + " name:" + playerData[i].playerName + " socket:" + playerData[i].playerSocket + " kills:" + playerData[i].playerKills + " deaths:"  + playerData[i].playerDeaths);
    }
}

// List presentWreckages list (all present wrecks), only server console output
function logWreckages() {
    console.log("wrecks: " + presentWreckages.length);
    for(var i = 0; i < presentWreckages.length; i++) {
        console.log("id: " + presentWreckages[i].wreckId + " x:" + presentWreckages[i].wreckX + " y:" + presentWreckages[i].wreckY + " z:" + presentWreckages[i].wreckZ);
    }
}