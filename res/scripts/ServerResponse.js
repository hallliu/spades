"use strict";

define(["Constants", "underscore", "Globals", "ChatArea", "SeatPicker", "ScoringArea", "PlayerInfoManager", "ScoreModel", "CardUI"],
       function(Constants, _, Globals, ChatArea, SeatPicker, ScoringArea, PlayerInfoManager, ScoreModel, CardUI) {

var chat_area = ChatArea.obtain();

var canonical_pos_to_board_pos = function(canonical_pos) {
    return (canonical_pos - Globals.player_position + 4) % 4;
};

var _update_names = function(player_names, team_names) {
    var name_dict = {
        player_names: player_names,
        team_names: team_names
    };
    ScoringArea.obtain().update_names(name_dict);
    PlayerInfoManager.obtain().update_names(name_dict);
};

var handle_successful_join = function(msg) {
    console.log(msg);
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
    console.log(msg);
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
    console.log("new_player_joined: " + msg);
    var new_player_name = msg.current_players[msg.newly_joined_position].name;

    chat_area.push_info_message(new_player_name + " has joined the room!");
    var player_names = _.mapObject(msg.current_players, function(pl) {
        return pl.name;
    });
    _update_names(player_names, undefined);
};

var handle_new_game = function(msg) {
    console.log("new_game:"  + msg);
    ScoreModel.obtain().clear_scores();
    var this_player_cards = _.map(msg.cards, function(card_id) {
        return new CardUI.Card(card_id).flip(true);
    });
    var other_player_cards = _.map(_.range(3), function() {
        return _.map(_.range(13), function() {
            // Initialize all other cards to 0. Change when necessary.
            return new CardUI.Card(0).flip(true);
        });
    });

    var bottom_deck = _.find(window.decks, function(d) {return d.board_position === "bottom";});
    bottom_deck.initialize_with_cards(this_player_cards)
            .then(function() {
                bottom_deck.flip_all_cards();
            });
    var other_decks = _.filter(window.decks, function(d) {return d.board_position !== "bottom";});
    _.each(other_decks, function(deck, idx) {
        deck.initialize_with_cards(other_player_cards[idx]);
    });
};

var setup_socket = function(socket) {
    socket.on("successful_join", handle_successful_join);
    socket.on("position_full", handle_position_full);
    socket.on("new_player_joined", handle_new_player_joined);
    socket.on("start_game", handle_new_game);
};

return {setup_socket: setup_socket};
});
