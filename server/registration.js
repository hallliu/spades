"use strict";

const uuid = require("node-uuid");
const Immutable = require("immutable");
const _ = require("underscore");

const IMap = Immutable.Map;
/**
 * @param existing_rooms: Immutable.Map - maps room ids to their room structures
 */

const make_room_info = function(player_positions, player_to_name) {
    return player_positions.map(function(v) {
        return {
            uuid: v,
            name: player_to_name.get(v),
        };
    }).toJS();
};

const get_new_room_id = function(existing_rooms) {
    var room_id = uuid.v4().slice(0, 8);
    if (!existing_rooms.has(room_id)) {
        return room_id;
    }
    return get_new_room_id(existing_rooms);
};

exports.register_new_session = function(
        player_to_room, room_details, player_to_name,
        req, res) {
    console.log("New session requested.");
    const player_uuid = uuid.v1();
    player_to_name = player_to_name.set(player_uuid, req.body.name);

    const new_room_id = get_new_room_id(room_details);
    player_to_room = player_to_room.set(player_uuid, new_room_id);

    const new_room = IMap({
        speculative_players: IMap(),
        players: IMap([[0, player_uuid]]),
        teams: IMap(),
        last_active: _.now(),
    });

    room_details = room_details.set(new_room_id, new_room);

    res.json({
        room_id: new_room_id,
        player_uuid: player_uuid,
        player_position: 0,
    });
    console.log(`Created new room: ${new_room_id} for player ${player_uuid}`);
    return [player_to_room, room_details, player_to_name];
};

exports.register_player_to_room = function(
        player_to_room, room_details, player_to_name, make_timeout,
        req, res) {
    const room_id = req.body.room_id;
    const player_uuid = uuid.v1();
    player_to_name = player_to_name.set(player_uuid, req.body.name);

    console.log(`Requesting to join room ${room_id}`);
    if (!room_details.has(room_id)) {
        console.log(`Invalid room ${room_id}`);
        res.status(404).json({error: "Room id specified does not exist"});
        return;
    }
    if (room_details.getIn([room_id, "players"]).size
        + room_details.getIn([room_id, "speculative_players"]).size >= 4) {

        console.log(`Room ${room_id} is full.`);
        res.status(409).json({error: "Room is full"});
        return;
    }

    // TODO: remove this timeout after the player picks a position.
    room_details = room_details.setIn([room_id, "speculative_players", player_uuid],
                                                make_timeout(room_id, player_uuid));
    player_to_room = player_to_room.set(player_uuid, room_id);

    const room_info = make_room_info(room_details.getIn([room_id, "players"]), player_to_name);
    res.json({
        player_uuid: player_uuid,
        current_players: room_info,
    });
    console.log(`Responded to player ${player_uuid} with info for room ${room_id}`);
    return [player_to_room, room_details, player_to_name];
};