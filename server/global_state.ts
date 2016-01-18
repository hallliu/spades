import Immutable = require("immutable");
import winston = require("winston");

import RoomInfo = require("./room_info");
const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
    ],
});

var room_registry: {[key: string]: RoomInfo} = {};
var player_to_name: Immutable.Map<string, string> = Immutable.Map<string, string>();
var player_to_room_id: Immutable.Map<string, string> = Immutable.Map<string, string>();

export function get_room_info(room_id: string): RoomInfo {
    return room_registry[room_id];
}

export function get_player_name(player_id: string) {
    return player_to_name.get(player_id);
}

export function get_room_of_player(player_id: string) {
    return player_to_room_id.get(player_id);
}

export function register_room(info: RoomInfo): boolean {
    var id = info.id;
    if (id in room_registry) {
        logger.log("warning", `Room ${id} already registered.`);
        return false;
    }
    room_registry[id] = info;
    return true;
}

export function update_room(info: RoomInfo): boolean {
    var id = info.id;
    if (!(id in room_registry)) {
        logger.log("warning", `Room ${id} does not exist. Cannot change`);
        return false;
    }
    room_registry[id] = info;
}

export function add_player_name(player_id: string, name: string): boolean {
    if (player_to_name.has(player_id)) {
        logger.log("warning", `Player ${player_id} already has a name`);
        return false;
    }
    player_to_name = player_to_name.set(player_id, name);
    return true;
}

export function change_player_name(player_id: string, name: string): boolean {
    if (!player_to_name.has(player_id)) {
        logger.log("warning", `Player ${player_id} does not exist yet.`);
        return false;
    }
    player_to_name = player_to_name.set(player_id, name);
    return true;
}

export function put_player_in_room(player_id: string, room_id: string): boolean {
    if (!player_to_name.has(player_id)) {
        logger.log("warning", `Player ${player_id} not yet registered with a name`);
        return false;
    }
    if (!(room_id in room_registry)) {
        logger.log("warning", `Room ${room_id} does not exist in room registry.`);
        return false;
    }
    player_to_room_id = player_to_room_id.set(player_id, room_id);
    return true;
}
