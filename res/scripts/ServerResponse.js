"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "SeatPicker", "ScoringArea", "PlayerInfoManager"],
       function(Constants, _, Globals, ChatArea, SeatPicker, ScoringArea, PlayerInfoManager) {

var chat_area = ChatArea.obtain();

var handle_successful_join = function(msg) {
    chat_area.push_info_message("Successfully joined room " + Globals.room_id);
    msg.player_names = _.mapObject(msg.current_players, function(pl) {
        return pl.name;
    });
    Globals.player_position = parseInt(_.findKey(msg.current_players, function(pl) {
        return pl.uuid === Globals.player_uuid;
    }));
    PlayerInfoManager.obtain().update_player_position(Globals.player_position);
    ScoringArea.obtain().update_names(msg);
    PlayerInfoManager.obtain().update_names(msg);
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

var setup_socket = function(socket) {
    socket.on("successful_join", handle_successful_join);
    socket.on("position_full", handle_position_full);
};

return {setup_socket: setup_socket};
});
