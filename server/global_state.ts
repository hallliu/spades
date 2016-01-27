import Immutable = require("immutable");
import winston = require("winston");

import RoomInfo = require("./room_info");
const logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
    ],
});

export interface IGlobalState {
    get_room_info(room_id: string): RoomInfo;
    get_player_name(player_id: string): string;
    get_room_of_player(player_id: string): string;
    register_room(info: RoomInfo): boolean;
    update_room(info: RoomInfo): boolean;
    add_player_name(player_id: string, name: string): boolean;
    change_player_name(player_id: string, name: string): boolean;
    put_player_in_room(player_id: string, room_id: string): boolean;
}

class GlobalStateImpl implements IGlobalState {
    private room_registry: {[key: string]: RoomInfo};
    private player_to_name: Immutable.Map<string, string>;
    private player_to_room_id: Immutable.Map<string, string>;

    constructor() {
        this.room_registry = {};
        this.player_to_name = Immutable.Map<string, string>();
        this.player_to_room_id = Immutable.Map<string, string>();
    }

    get_room_info(room_id: string): RoomInfo {
        return this.room_registry[room_id];
    }

    get_player_name(player_id: string): string {
        return this.player_to_name.get(player_id);
    }

    get_room_of_player(player_id: string): string {
        return this.player_to_room_id.get(player_id);
    }

    register_room(info: RoomInfo): boolean {
        var id = info.id;
        if (id in this.room_registry) {
            logger.log("warning", `Room ${id} already registered.`);
            return false;
        }
        this.room_registry[id] = info;
        return true;
    }

    update_room(info: RoomInfo): boolean {
        var id = info.id;
        if (!(id in this.room_registry)) {
            logger.log("warning", `Room ${id} does not exist. Cannot change`);
            return false;
        }
        this.room_registry[id] = info;
    }

    add_player_name(player_id: string, name: string): boolean {
        if (this.player_to_name.has(player_id)) {
            logger.log("warning", `Player ${player_id} already has a name`);
            return false;
        }
        this.player_to_name = this.player_to_name.set(player_id, name);
        return true;
    }

    change_player_name(player_id: string, name: string): boolean {
        if (!this.player_to_name.has(player_id)) {
            logger.log("warning", `Player ${player_id} does not exist yet.`);
            return false;
        }
        this.player_to_name = this.player_to_name.set(player_id, name);
        return true;
    }

    put_player_in_room(player_id: string, room_id: string): boolean {
        if (!this.player_to_name.has(player_id)) {
            logger.log("warning", `Player ${player_id} not yet registered with a name`);
            return false;
        }
        if (!(room_id in this.room_registry)) {
            logger.log("warning", `Room ${room_id} does not exist in room registry.`);
            return false;
        }
        this.player_to_room_id = this.player_to_room_id.set(player_id, room_id);
        return true;
    }
}

var global_state_singleton = new GlobalStateImpl();

export function obtain(): IGlobalState {
    return global_state_singleton;
};
