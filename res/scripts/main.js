"use strict";

define(["./CardUI", "./PlayArea", "velocity", "underscore", "socketio", "ScoringArea",
       "ScoreModel", "UIPosition", "ChatArea"],
        function(CardUI, PlayArea, Velocity, _, io, ScoringArea,
                 ScoreModel, UIPosition, ChatArea) {
    var socket = io();
    var player_name = ""; // TODO: move to global configs

    UIPosition.set_positions();        

    // chat listener
    ChatArea.obtain().add_listener({
        on_text_entered: function(t) {
            if (t.charAt(0) === '/') {
               return;
            } 
            socket.emit("chat_message", {
                author: player_name,
                message: t,
            });
        }
    });

    // command listener
    ChatArea.obtain().add_listener({
        on_text_entered: function(t) {
            if (t.charAt(0) !== '/') {
                return;
            }
            if (t.charAt(1) === '/') {
                // escape with slash
                socket.emit("chat_message", {
                    author: player_name,
                    message: t.slice(1),
                });
            }
                
            var command_tokens = t.split(/\s+/);
            switch (command_tokens[0].slice(1)) {
                case "name":
                    if (command_tokens.length < 2 || command_tokens[1].length === 0) {
                        console.log("Name must be of nonzero length");
                        break;
                    }
                    console.log("player name: " + command_tokens[1]);
                    socket.emit("name_change", {
                        old_name: player_name,
                        new_name: command_tokens[1],
                    });

                    player_name = command_tokens[1];
                    break;
            }
        }
    });

    // Socket listener
    socket.on("chat_message", function(msg) {
        ChatArea.obtain().push_chat_message(`${msg.author}: ${msg.message}`);
    });

    var all_cards = _.range(52);
    all_cards = _.shuffle(all_cards);
    var positions = ["bottom", "top", "left", "right"];
    var decks = _.map(_.range(4), function(i) {
        var card_coll = _.map(_.range(i*13, (i+1)*13), function(j) {
            return new CardUI.Card(all_cards[j]);
        });
        return new CardUI.Deck(card_coll, positions[i], true);
    });

    var play_area = PlayArea.obtain();
    play_area.set_suit("hearts");

    var scoring_area = ScoringArea.obtain();
    var score_model = ScoreModel.obtain();

    decks.forEach(function(d) {d.attach()});
    window.decks = decks;
    window.play_area = play_area;
    window.scoring_area = scoring_area;
    window.score_model = score_model;
    window.socket = io();
    scoring_area.update_names({team_1: {
        name: "Team 1",
        player_1: "playerA",
        player_2: "playerB",
    },
    team_2: {
        name: "Team 2",
        player_1: "playerC",
        player_2: "playerD",
    }});
});
