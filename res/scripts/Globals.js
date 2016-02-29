"use strict";

/**
 * Set of global variables, to be used minimally.
 */
define([], function() {
    var global_variables = {
        player_name: null,
        socket: null,
        player_uuid: null,
        room_id: null,
        player_position: null,
        autodebug: false, // Set to true for automatic reply to server messages.
    };

    return global_variables;
});
