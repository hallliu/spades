import socketio = require("socket.io");
import winston = require("winston");

import global_state = require("./global_state");
import {position_choice_handler} from "./registration";

interface ChatMessage {
    author: string,
    message: string
}

interface PositionChoiceMessage {
    room_id: string,
    position: number
}

export interface IOMessage {
    room?: string,
    message: string,
    contents: {[key: string]: any}
}

export function register_handlers(player_id: string, io: SocketIO.Server, socket: SocketIO.Socket) {
    socket.on("chat_message", function(msg: ChatMessage) {
        var current_room = global_state.get_room_of_player(player_id);
        if (current_room === null) {
            msg.message += " (not broadcasted)";
            socket.emit("chat_message", msg);
        } else {
            io.to(current_room).emit("chat_message", msg);
        }
    });

    socket.on("position_choice", function(msg: PositionChoiceMessage) {
        var results: IOMessage[] = position_choice_handler(player_id, msg.position);
        exec_results(results, io, socket);
        if (results[0].message === "successful_join" || results[1].message === "successful_join") {
            socket.join(msg.room_id);
        } 
    });
}

function exec_results(msgs: IOMessage[], io: SocketIO.Server, socket: SocketIO.Socket) {
    msgs.forEach((msg: IOMessage)=>{
        if (msg.room) {
            io.to(msg.room).emit(msg.message, msg.contents);
        } else {
            socket.emit(msg.message, msg.contents);
        }
    });
}
