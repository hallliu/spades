import socketio = require("socket.io");
import winston = require("winston");

import {position_choice_handler} from "./registration";
import {IGlobalState} from "./global_state";
import {create_new_hand, handle_player_bid} from "./game_driver";

const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
    ],
});

interface ChatMessage {
    author: string,
    message: string
}

interface PositionChoiceMessage {
    room_id: string,
    position: number
}

interface MakeBidMessage {
    bid: number
}

export interface IOMessage {
    room?: string,
    message: string,
    contents: {[key: string]: any}
}

export function register_handlers(global_state: IGlobalState, player_id: string,
                                  io: SocketIO.Server, socket: SocketIO.Socket) {
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
        var results: IOMessage[] = position_choice_handler(global_state, msg.room_id, player_id, msg.position);
        exec_results(results, io, socket);
        if (results[0].message === "successful_join" || results[1].message === "successful_join") {
            socket.join(msg.room_id);
        } 
        if (global_state.get_room_info(msg.room_id).players.size === 4) {
            let {hand, msgs} = create_new_hand(global_state.get_room_info(msg.room_id),
                                                   global_state.get_socket_id_mapping(), true);
            global_state.set_hand_for_room(msg.room_id, hand);
            exec_results(msgs, io, socket);
        }
    });

    socket.on("make_bid", function(msg: MakeBidMessage) {
        let room_id = global_state.get_room_of_player(player_id);
        if (room_id == null) {
            logger.log("error", `Player ${player_id} is not associated to a room`);
            return;
        }
        let curr_hand = global_state.get_hand_for_room(room_id);
        if (curr_hand === null) {
            logger.log("error", `Room ${room_id} has no active hand ongoing`);
            return;
        }
        let room_info = global_state.get_room_info(room_id);
        let {hand, msgs} = handle_player_bid(room_info, player_id, curr_hand, msg.bid);
        exec_results(msgs, io, socket);
    });

    // Join the socket.io room that the player is supposed to be in, if player was the first player
    var room_id = global_state.get_room_of_player(player_id);
    if (room_id && global_state.get_room_info(room_id).players.includes(player_id)) {
        socket.join(room_id);
    }

    // Register the socket id
    global_state.associate_player_with_socket(player_id, socket.id);
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
