import _ = require("underscore");
import uuid = require("node-uuid");
import winston = require("winston");
import express = require("express");

const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
    ],
});

import RoomInfo = require("./room_info");
import {IGlobalState} from "./global_state";
import {IOMessage} from "./handlers";

function make_room_info(player_positions: {[key: number]: string},
        player_to_name: (x:string)=>string): {[key: number]: any} {
    return _.mapObject(player_positions, function(v) {
        return {
            uuid: v,
            name: player_to_name(v),
        }
    });
}

function get_new_room_id(does_id_exist: (x: string)=>boolean): string {
    var room_id = uuid.v4().slice(0, 8);
    if (!does_id_exist(room_id)) {
        return room_id;
    }
    return get_new_room_id(does_id_exist);
}

function get_speculation_timeout(global_state: IGlobalState,
                                 room_id: string, player_id: string): NodeJS.Timer {
    return setTimeout(() => {
        logger.info(`Player ${player_id} timed out joining room ${room_id}`);
        var room_info = global_state.get_room_info(room_id);
        global_state.update_room(room_info.clear_speculative_timeout(player_id));
    }, 10000);
}

export function register_new_session(global_state: IGlobalState,
                                     req: express.Request, res: express.Response) {
    logger.log("info", "New session requested.");
    var player_uuid = uuid.v1();
    global_state.add_player_name(player_uuid, req.body["name"]);
    var room_id = get_new_room_id((x: string) => {
        return global_state.get_room_info(x) === null;
    });

    var new_room = new RoomInfo(room_id).add_player(0, player_uuid);
    global_state.register_room(new_room);
    global_state.put_player_in_room(player_uuid, room_id);

    res.json({
        room_id: room_id,
        player_uuid: player_uuid,
        player_position: 0,
    });
    logger.log("info", `Created new room: ${room_id} for player ${player_uuid}`);
}

export function register_player_to_room(global_state: IGlobalState,
                                        req: express.Request, res: express.Response) {
    var requested_room_id: string = req.body["room_id"];
    logger.log("info", `Requesting to join room ${requested_room_id}`);
    if (global_state.get_room_info(requested_room_id) === null) {
        logger.log("warn", `Invalid room ${requested_room_id}`);
        res.status(404).json({
            error: "Room id specified does not exist",
        });
        return;
    }
    var requested_room = global_state.get_room_info(requested_room_id);
    if (requested_room.is_full()) {
        logger.log("warn", `Room ${requested_room_id} is full`);
        res.status(409).json({
            error: "Room is full",
        });
        return;
    }
    
    var player_uuid = uuid.v1();
    global_state.add_player_name(player_uuid, req.body["name"]);
    global_state.update_room(requested_room.add_new_speculative_player(player_uuid,
            get_speculation_timeout(global_state, requested_room_id, player_uuid)));
    
    res.json({
        player_uuid: player_uuid,
        current_players: make_room_info(requested_room.players.toJS(), (pid: string)=>{
            return global_state.get_player_name(pid);
        }),
    });
    logger.log("info", `Responded to player ${player_uuid} with info for room ${requested_room_id}`);
}

export function position_choice_handler(global_state: IGlobalState, room_id: string,
                                        player_id: string, position: number): IOMessage[] {
    logger.log("info", `Player ${player_id} chose position ${position}`);
    if (global_state.get_room_of_player(player_id) === null) {
        logger.log("warning", `Player attempted to choose position before room`);
        return [];
    }
    var room_info = global_state.get_room_info(room_id).clear_speculative_timeout(player_id);

    global_state.update_room(room_info);

    if (room_info.players.size >= 4) {
        return [{message: "room_full",
            contents: {}}];
    }

    if (room_info.players.has(position)) {
        global_state.update_room(room_info.add_new_speculative_player(player_id,
                get_speculation_timeout(global_state, room_id, player_id)));
        return [{message: "position_full",
            contents: {
                current_players: make_room_info(room_info.players.toJS(), (pid: string)=>{
                    return global_state.get_player_name(pid);
                })
            }}];
    }

    room_info = room_info.add_player(position, player_id);
    global_state.update_room(room_info);

    var message_contents =  {
        current_players: make_room_info(room_info.players.toJS(), (pid: string)=>{
            return global_state.get_player_name(pid);
        }),
        newly_joined_position: position,
    }

    return [
        {
            message: "successful_join",
            contents: message_contents
        },
        {
            message: "new_player_joined",
            room: room_id,
            contents: message_contents
        }
    ];
}
