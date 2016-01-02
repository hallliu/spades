"use strict";

const express = require("express");
const _ = require("underscore");
const uuid = require("node-uuid");

const Immutable = require("immutable");
const IMap = Immutable.Map;

const app = express();

const http = require('http').Server(app);
const io = require('socket.io')(http);


const registration = require("./server/registration.js");

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
    if (!_.has(room_to_details, room_id)) {
        return room_id;
    }
    return get_new_room_id();
};
 
var room_to_details = IMap();
var player_to_name = IMap();
var player_to_room = IMap();

const make_position_choice_timeout = function(room_id, player_uuid) {
    var callback = function() {
        console.log(`Player ${player_uuid} timed out picking a position in room ${room_id}.`);
        room_to_details = room_to_details.deleteIn([room_id, "speculative_players", player_uuid]);
    };
    return setTimeout(callback, 10000);
};

app.post("/register", function(req, res) {
    if (req.body.new_session) {
        var ret = registration.register_new_session(player_to_room, room_to_details, player_to_name,
                req, res);
        player_to_room = ret[0];
        room_to_details = ret[1];
        player_to_name= ret[2];
    } else {  
        // TODO: remove this timeout after the player picks a position.
        var ret = registration.register_player_to_room(player_to_room, room_to_details, player_to_name,
                make_position_choice_timeout, req, res);
        player_to_room = ret[0];
        room_to_details = ret[1];
        player_to_name= ret[2];
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
                `${msg.position} in room ${player_to_room.get(player_uuid)}`);
        var room_id = player_to_room.get(player_uuid);        
        var room_internals = room_to_details.get(room_id);
        if (!room_internals) {
            console.log("Player sending a position choice hasn't picked a room!");
            return;
        }
        if (room_internals.hasIn(["speculative_players", player_id])) {
            clearTimeout(room_internals.getIn(["speculative_players", player_id]));
        }
        var ret = registration.set_player_position(player_to_name,
                _.partial(make_position_choice_timeout, room_id),
                room_internals, msg.position, player_uuid);

        room_to_details = room_to_details.set(room_id, ret[0]);
        socket.emit.apply(null, ret[1]);
    });

    socket.on("disconnect", function() {
        console.log("User disconnected");
    });
});

http.listen(3000, function() {});
