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
    var new_player_name = msg.current_players[msg.newly_joined_position].name;

    chat_area.push_info_message(new_player_name + " has joined the room!");
    var player_names = _.mapObject(msg.current_players, function(pl) {
        return pl.name;
    });
    _update_names(player_names, undefined);
};

var handle_start_game = function(msg) {
    ScoreModel.obtain().clear_scores();
    handle_start_round(msg);
};

var handle_start_round = function(msg) {
    console.log(msg);
    Globals.spades_broken = false;
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
    ScoreModel.obtain().start_new_round();
};

var handle_bid_round = function(msg) {
    console.log(msg);
    if (msg.bidding_user === Globals.player_position) {
        chat_area.push_info_message("Please enter your bid, using /bid <x>.");
    }
    else {
        chat_area.push_info_message(PlayerInfoManager.obtain().name_dict.player_names[msg.bidding_user]
                                    + " is now bidding.");
    }
    PlayerInfoManager.obtain().set_active_player(msg.bidding_user);
};

var handle_invalid_bid = function(msg) {
    console.log(msg);
    chat_area.push_info_message("Your bid was not accepted: " + msg.reason);
};

var handle_user_bid = function(msg) {
    if (msg.bidding_user === Globals.player_position) {
        chat_area.push_info_message("Bid successful.");
    } else {
        chat_area.push_info_message(PlayerInfoManager.obtain().name_dict.player_names[msg.bidding_user]
                                    + " has bid " + msg.bid);
    }
    
    ScoreModel.obtain().add_bid(msg.bidding_user, msg.bid);
};

var handle_make_play = function(msg) {
    if (msg.player === Globals.player_position) {
        var player_deck = _.find(window.decks, function(d) {return d.board_position === "bottom";});
        player_deck.arm_cards(function(card_id) {
            Globals.socket.emit("play_card", {
                card: card_id
            });
        });
    }
    PlayerInfoManager.obtain().set_active_player(msg.player);
};

var handle_play_made = function(msg) {
    if (msg.player === Globals.player_position) {
        // The animation was performed when the player played the card
        return;
    }

    var deck = PlayerInfoManager.obtain().player_to_deck[msg.player];
    deck.launch_fake_card_as(msg.card);
}

var setup_socket = function(socket) {
    socket.on("successful_join", handle_successful_join);
    socket.on("position_full", handle_position_full);
    socket.on("new_player_joined", handle_new_player_joined);
    socket.on("start_game", handle_start_game);
    socket.on("start_round", handle_start_round);
    socket.on("bid_round", handle_bid_round);
    socket.on("invalid_bid", handle_invalid_bid);
    socket.on("user_bid", handle_user_bid);
    socket.on("make_play", handle_make_play);
};

return {setup_socket: setup_socket};
});
