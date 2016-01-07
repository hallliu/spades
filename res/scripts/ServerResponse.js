"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "SeatPicker"],
       function(Constants, _, Globals, ChatArea, SeatPicker) {

var chat_area = ChatArea.obtain();

var handle_successful_join = function(msg) {
    chat_area.push_info_message("Successfully joined room " + Globals.room_id);
    // TODO: update the UI with players' names
};

var handle_position_full = function(msg) {
    
};

var setup_socket = function(socket) {
    
};

return {setup_socket: setup_socket};

});
