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
    var card_coll = _.map(all_cards, function(card_id) {
        return new CardUI.Card(card_id);
    });

    var positions = ["bottom", "top", "left", "right"];
    var decks = _.map(_.range(4), function(i) {
        return new CardUI.Deck([], positions[i], i === 0);
    });

    var play_area = PlayArea.obtain();
    _.each(card_coll, function(card) {
        card.flip(true);
    });

    var deal_cards = function(cards, decks) {
        var deck_animation_promises = {}
        _.each(decks, function(deck, idx) {
            var this_deck_cards = cards.slice(idx * 13, (idx + 1) * 13);
            deck_animation_promises[idx] = deck.initialize_with_cards(this_deck_cards);
        });
        deck_animation_promises[0].then(function() {
            decks[0].flip_all_cards();
        });
    };

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
    window.all_cards = card_coll;
    window.deal_cards = deal_cards;
    scoring_area.update_names({
        team_0: "Team 1",
        team_1: "Team 2",
        player_0: "playerA",
        player_1: "playerB",
        player_2: "playerC",
        player_3: "playerD",
    });
});
