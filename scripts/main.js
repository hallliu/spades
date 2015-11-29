"use strict";

define(["./CardUI", "velocity", "underscore"], function(CardUI, Velocity, _) {
    var all_cards = _.range(52);
    all_cards = _.shuffle(all_cards);
    var positions = ["bottom", "top", "left", "right"];
    var decks = _.map(_.range(4), function(i) {
        var card_coll = _.map(_.range(i*13, (i+1)*13), function(j) {
            return new CardUI.Card(all_cards[j]);
        });
        return new CardUI.Deck(card_coll, positions[i], true);
    });

    decks.forEach(function(d) {d.attach()});
    window.decks = decks;
});
