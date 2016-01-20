"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "SeatPicker", "ScoringArea", "PlayerInfoManager"],
       function(Constants, _, Globals, ChatArea, SeatPicker, ScoringArea, PlayerInfoManager) {

var chat_area = ChatArea.obtain();
var translate_name_message = function(name_message) {
    return {

    };
}

var handle_successful_join = function(msg) {
    chat_area.push_info_message("Successfully joined room " + Globals.room_id);
    msg.player_names = msg.current_players;
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
    
};

return {setup_socket: setup_socket};

});
