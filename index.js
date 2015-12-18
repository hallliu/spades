"use strict";

var express = require("express");
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("res/"));

app.get("/", function(req, res) {
    res.sendFile("index.html");
});

io.on("connection", function(socket) {
    console.log("User connected");
});

http.listen(3000, function() {});
