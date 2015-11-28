"use strict";

define(["./CardUI", "velocity", "underscore"], function(CardUI, Velocity, _) {
    var sample_card = new CardUI.Card(15);
    var card_coll = _.map([14, 18, 34, 11, 26], function(cid) {return new CardUI.Card(cid);});
    var deck = new CardUI.Deck(card_coll);
    deck.attach();

    window.deck = deck;
    window.card_coll = card_coll;
    window.sample_card = sample_card;
});
