"use strict";

var express = require("express");
var _ = require("underscore");
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("res/"));

app.get("/", function(req, res) {
    res.sendFile("index.html");
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
