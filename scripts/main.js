"use strict";

define(["./CardUI", "./PlayArea", "velocity", "underscore"],
        function(CardUI, PlayArea, Velocity, _) {
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

    decks.forEach(function(d) {d.attach()});
    window.decks = decks;
});
