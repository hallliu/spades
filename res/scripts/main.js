"use strict";

define(["./CardUI", "./PlayArea", "velocity", "underscore", "socketio", "ScoringArea",
       "ScoreModel", "UIPosition", "ChatArea", "Command", "Globals", "SeatPicker"],
        function(CardUI, PlayArea, Velocity, _, io, ScoringArea,
                 ScoreModel, UIPosition, ChatArea, Command, Globals, SeatPicker) {
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
        on_text_entered: Command.command_text_processor
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
    window.Globals = Globals;
    window.seat_picker = SeatPicker.obtain();
    scoring_area.update_names({
        team_0: "Team 1",
        team_1: "Team 2",
        player_0: "playerA",
        player_1: "playerB",
        player_2: "playerC",
        player_3: "playerD",
    });
});
