import express = require("express");
import socketio = require("socket.io");
import http = require("http");

import registration = require("./registration");
import global_state = require("./global_state");
import {register_handlers} from "./handlers";

const app = express();
const http_mod = http.createServer(app);
const io = socketio(http_mod);

var state = global_state.obtain();

app.use(express.static("res/"));
app.use(require("body-parser").json());

app.get("/", function(req, res) {
    res.sendFile("index.html");
});

app.post("/register", function(req, res) {
    if (req.body["new_session"]) {
        registration.register_new_session(state, req, res);
    } else {
        registration.register_player_to_room(state, req, res);
    }
});

io.on("connection", function(socket) {
    socket.on("register_socket", function(msg: {[key: string]: any}) {
        var player_uuid: string = msg["player_uuid"];
        register_handlers(state, player_uuid, io, socket);
    });
});

http_mod.listen(3000, ()=>{});
