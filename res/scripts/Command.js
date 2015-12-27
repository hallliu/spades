"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "socketio", "jquery", "SeatPicker"],
       function(Constants, _, Globals, ChatArea, io, $, SeatPicker) {

    var chat_area = ChatArea.obtain();
    var is_nonempty_string = function(x) {
        return (_.isString(x) && x.length > 0) 
    }

    var process_name = function(name) {
        if (!is_nonempty_string(name)) {
            chat_area.push_info_message("Name must be of nonzero length");
            return;
        }
        chat_area.push_info_message("Setting player name to: " + name);

        // This command can be used before a socket is established.
        if (Globals.socket) {
            Globals.socket.emit("name_change", {
                old_name: Globals.player_name,
                new_name: name,
            });
        }

        Globals.player_name = name
        return;
    };

    var process_newroom = function() {
        if (!is_nonempty_string(Globals.player_name)) {
            chat_area.push_info_message("You must set your name with /name first.");
            return;
        }
        if (is_nonempty_string(Globals.room_id)) {
            chat_area.push_info_message("You are already in a room. Refresh the page if you want to join another.");
            return;
        }
        chat_area.push_info_message("Starting a new room... wait up.");
        var post_data = {
            name: Globals.player_name,
            new_session: true,
        };
        $.ajax({
            type: "POST",
            url: "/register",
            processData: false,
            contentType: "application/json",
            data: JSON.stringify(post_data),
        }).then(function(room_data) {
            Globals.player_uuid = room_data.player_uuid;
            Globals.room_id = room_data.room_id;
            chat_area.push_info_message(`Success! Your room id is ${Globals.room_id}. Share this with other players.`);
            Globals.socket = io();
            Globals.socket.emit("register_socket", {
                player_uuid: Globals.player_uuid
            });
        }, function(req) {
            chat_area.push_info_message("An unexplainable error happened. See console for details.");
            console.log(req);
        });
    };

    var process_joinroom = function(room_id) {
        if (!is_nonempty_string(Globals.player_name)) {
            chat_area.push_info_message("You must set your name with /name first.");
            return;
        }
        if (!is_nonempty_string(room_id)) {
            chat_area.push_info_message("You must enter a nonempty room id.");
            return;
        }
        if (is_nonempty_string(Globals.room_id)) {
            chat_area.push_info_message("You are already in a room. Refresh the page if you want to join another.");
            return;
        }
        chat_area.push_info_message("Attempting to join room " + room_id);

        var post_data = {
            name: Globals.player_name,
            new_session: false,
            room_id: room_id,
        };

        $.ajax({
            type: "POST",
            url: "/register",
            processData: false,
            contentType: "application/json",
            data: JSON.stringify(post_data),
        }).then(function(room_data) {
            Globals.player_uuid = room_data.player_uuid;
            Globals.socket = io();
            Globals.socket.emit("register_socket", {
                player_uuid: Globals.player_uuid
            });
            var pick_seat_action = function(picked_seat) {
                Globals.socket.emit("position_choice", {
                    position: picked_seat,
                });
            };
            SeatPicker.obtain().show(_.mapObject(room_data.current_players, function(info) {
                return info.name;
            }), pick_seat_action);
        }, function(req) {
            if (req.status === 404) {
                chat_area.push_info_message("This room was not found.");
            } else if (req.status === 409) {
                chat_area.push_info_message("This room is full.");
            } else {
                chat_area.push_info_message("Unexplainable error. Check console for details.");
                console.log(req);
            }
        });
    };

    var process_undefined = function() {
        chat_area.push_info_message("That command is not yet implemented or invalid.");
    }

    var command_registry = {
        "name": process_name,
        "newroom": process_newroom,
        "joinroom": process_joinroom,
    };

    var command_text_processor = function(text) {
        if (text.charAt(0) !== '/') {
            return;
        }
        if (text.charAt(1) === '/') {
            // escape chat message with slash
            Globals.socket.emit("chat_message", {
                author: Globals.player_name,
                message: text.slice(1),
            });
        }
            
        var command_tokens = text.split(/\s+/);
        var args = command_tokens.slice(1);
        var command = command_tokens[0].slice(1);

        (command_registry[command] || process_undefined).apply(null, args);
    };

    return {command_text_processor: command_text_processor};
});
