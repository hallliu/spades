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

var get_new_room_id = function() {
    var room_id = uuid.v4().slice(0, 8);
    if (!_.has(room_details, room_id)) {
        return room_id;
    }
    return get_new_room_id();
};
 
var room_details = {};
var player_to_name = {};
var player_to_room = {};

app.post("/register", function(req, res) {
    // Always generate a player id here
    var player_uuid = uuid.v1();
    player_to_name[player_uuid] = req.body.name;

    if (req.body.new_session) {
        console.log("New session requested.");
        var new_room_id = get_new_room_id();
        player_to_room[player_uuid] = new_room_id;
        room_details[new_room_id] = {
            speculative_players: {},
            players: {
                0: player_uuid,
            },
            teams: {}, // contains team names.
            last_active: _.now(),
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
        // TODO: remove this timeout after the player picks a position.
        this_room_details.speculative_players[player_uuid] = setTimeout(function() {
            console.log(`Player ${player_uuid} timed out picking a position.`);
            delete this_room_details.speculative_players[player_uuid];
        }, 60000);

        player_to_room[player_uuid] = room_id;
        res.json({
            player_uuid: player_uuid,
            current_players: room_info,
        });
        console.log(`Responded to player ${player_uuid} with info for room ${room_id}`);
    }
});

var player_uuid_to_socket = {};

io.on("connection", function(socket) {
    var player_uuid;

    socket.on("chat_message", function(msg) {
        console.log(`Message from ${msg.author}: ${msg.message}`);
        io.emit("chat_message", msg);
    });

    socket.on("name_change", function(msg) {
        // TODO: implement this
    });

    socket.on("register_socket", function(msg) {
        player_uuid_to_socket[msg.player_uuid] = socket;
        player_uuid = msg.player_uuid;
    });

    socket.on("position_choice", function(msg) {
        console.log(`Player ${player_uuid} chose position ` +
                `${msg.position} in room ${player_to_room[player_uuid]}`);
        var room_internals = room_details[player_to_room[player_uuid]];
        if (!room_internals) {
            console.log("an error has occurred");
            return;
        }
        // TODO: normal flow
    });

    socket.on("disconnect", function() {
        console.log("User disconnected");
    });
});

http.listen(3000, function() {});
