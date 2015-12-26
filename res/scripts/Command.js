"use strict";

define(["Constants", "underscore", "Globals"],
       function(Constants, _, Globals) {
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
        switch (command_tokens[0].slice(1)) {
            case "name":
                if (command_tokens.length < 2 || command_tokens[1].length === 0) {
                    console.log("Name must be of nonzero length");
                    break;
                }
                console.log("player name: " + command_tokens[1]);
                Globals.socket.emit("name_change", {
                    old_name: Globals.player_name,
                    new_name: command_tokens[1],
                });

                Globals.player_name = command_tokens[1];
                break;
        }
    };

    return {command_text_processor: command_text_processor};
});
