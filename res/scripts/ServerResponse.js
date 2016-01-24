"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "SeatPicker", "ScoringArea", "PlayerInfoManager"],
       function(Constants, _, Globals, ChatArea, SeatPicker, ScoringArea, PlayerInfoManager) {

var chat_area = ChatArea.obtain();

var _update_names = function(player_names, team_names) {
    var name_dict = {
        player_names: player_names,
        team_names: team_names
    };
    ScoringArea.obtain().update_names(name_dict);
    PlayerInfoManager.obtain().update_names(name_dict);
};

var handle_successful_join = function(msg) {
    chat_area.push_info_message("Successfully joined room " + Globals.room_id);
    Globals.player_position = parseInt(_.findKey(msg.current_players, function(pl) {
        return pl.uuid === Globals.player_uuid;
    }));
    PlayerInfoManager.obtain().update_player_position(Globals.player_position);
    
    var player_names = _.mapObject(msg.current_players, function(pl) {
        return pl.name;
    });
    _update_names(player_names, undefined);
};

var handle_position_full = function(msg) {
    var pick_seat_action = function(picked_seat) {
        Globals.socket.emit("position_choice", {
            position: picked_seat,
            room_id: Globals.room_id,
        });
    };
    SeatPicker.obtain().show(_.mapObject(msg.current_players, function(info) {
        return info.name;
    }), pick_seat_action);
};

var handle_new_player_joined = function(msg) {
    var new_player_name = msg.current_players[msg.newly_joined_position].name;

    chat_area.push_info_message(new_player_name + " has joined the room!");
    var player_names = _.mapObject(msg.current_players, function(pl) {
        return pl.name;
    });
    _update_names(player_names, undefined);
};

var setup_socket = function(socket) {
    socket.on("successful_join", handle_successful_join);
    socket.on("position_full", handle_position_full);
    socket.on("new_player_joined", handle_new_player_joined);
};

return {setup_socket: setup_socket};
});
