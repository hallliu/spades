"use strict";

var express = require("express");
var _ = require("underscore");
var uuid = require("node-uuid");

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("res/"));
app.use(require("body-parser").json());

app.get("/", function(req, res) {
    res.sendFile("index.html");
});

var make_room_info = function(player_positions, player_to_name) {
    return _.mapObject(player_positions, function(v) {
        return {
            uuid: v,
            name: player_to_name[v],
        };
    });
};
 
var room_details = {};
var player_to_name = {};

app.post("/register", function(req, res) {
    // Always generate a player id here
    var player_uuid = uuid.v1();
    player_to_name[player_uuid] = req.body.name;

    if (req.body.new_session) {
        console.log("New session requested.");
        var new_room_id = uuid.v1();
        room_details[new_room_id] = {
            speculative_players: {},
            players: {
                0: player_uuid,
            },
            teams: {}, // contains team names.
        }
        res.json({
            room_id: new_room_id,
            player_uuid: player_uuid,
            player_position: 0,
        });
        console.log(`Created new room: ${new_room_id} for player ${player_uuid}`);
    } else {
        var room_id = req.body.room_id
        console.log(`Requesting to join room ${room_id}`);
        if (!_.has(room_details, room_id)) {
            console.log(`Invalid room ${room_id}`);
            res.status(404).json({error: "Room id specified does not exist"});
            return;
        }
        var this_room_details = room_details[room_id];
        if (_.size(this_room_details.players) + _.size(this_room_details.speculative_players) == 4) {
            console.log(`Room ${room_id} is full.`);
            res.status(409).json({error: "Room is full"});
            return;
        }

        var room_info = make_room_info(this_room_details.players, player_to_name);
        this_room_details.speculative_players[player_uuid] = setTimeout(function() {
            console.log(`Player ${player_uuid} timed out picking a position.`);
            delete this_room_details.speculative_players[player_uuid];
        }, 10000);

        res.json({
            player_uuid: player_uuid,
            current_players: room_info,
        });
        console.log(`Responded to player ${player_uuid} with info for room ${room_id}`);
    }
});

var name_to_socket = {};

io.on("connection", function(socket) {
    socket.on("chat_message", function(msg) {
        console.log(`Message from ${msg.author}: ${msg.message}`);
        io.emit("chat_message", msg);
    });

    socket.on("name_change", function(msg) {
        if (msg.old_name.length === 0) {
            console.log(`User ${msg.new_name} has registered themselves`);
        } else {
            console.log(`Name change from ${msg.old_name} to ${msg.new_name}`);
        }
        if (_.has(name_to_socket, msg.old_name)) {
            delete name_to_socket[msg.old_name];
        }
        name_to_socket[msg.new_name] = socket;
    });


    socket.on("disconnect", function() {
        console.log("User disconnected");
    });
});

http.listen(3000, function() {});
