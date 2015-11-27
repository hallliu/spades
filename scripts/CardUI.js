"use strict";
define(["velocity", "underscore"], function(Velocity, _) {
    const BACK_ID = "3";
    const CARD_NAMES = ["two", "three", "four", "five", "six", "seven", "eight", "nine",
            "ten", "jack", "queen", "king", "ace"];
    const SUIT_NAMES = ["spades", "hearts", "clubs", "diamonds"];

    var Card = function() {
        var Card = function(id_or_suit, number) {
            if (arguments.length === 1) {
                this.cid = id_or_suit;
                this.suit = SUIT_NAMES[Math.floor(this.cid / 13)];
                this.number = CARD_NAMES[this.cid % 13];
            } else {
                this.cid = 13 * SUIT_NAMES.indexOf(id_or_suit) + CARD_NAMES.indexOf(number);
                this.suit = id_or_suit;
                this.number = number;
            }
            this.el = $(_.template($("#card_template").html())({
                "suit": this.suit,
                "card": this.number,
                "back": BACK_ID,
            }));
            this.flipped = false;
        };

        Card.prototype.attach = function() {
            this.el.appendTo("#main-container");
        };

        Card.prototype.flip = function() {
            this.el.find(".card").velocity({"rotateY": this.flipped ? "0deg" : "180deg"});
            this.flipped = !this.flipped;
        };

        Card.prototype.slide_down = function() {
            this.el.velocity({"top": "200px"});
        };

        Card.prototype.slide_up = function() {
            this.el.velocity({"top": "0px"});
        };
        
        Card.prototype.on_added = function() {
            this.el.mouseenter(_.bind(function() {
                this.el.velocity({"top": "-20px"});
            }, this)).mouseleave(_.bind(function() {
                this.el.velocity({"top": "0px"});
            }, this));
        };

        Card.prototype.on_removed = function() {
            this.el.off("mouseenter").off("mouseleave");
        };

        return Card;
    }();

    var Deck = function() {
        const CARD_HEIGHT = "130px";
        const CARD_OFFSET = 20;
        const STARTING_Z = 0;
        var card_sort_cmp = function(card_a, card_b) {
            return card_a.cid - card_b.cid;
        };

        var Deck = function(cards) {
            this.cards = cards || [];
            this.cards.sort(card_sort_cmp);

            this.el = $($("#deck_template").html());
            this.card_container = this.el; // in case there need to be layers

            if (cards.length === 0) {
                this.el.css("height", CARD_HEIGHT);
            }
            this.cards.forEach(function(card, idx) {
                card.on_added();
                card.position_in_deck = idx;
            });
            this._render();
        };

        Deck.prototype.add_card = function(card) {
            if (this.cards.length === 0) {
                // Remove the added height
                this.el.css("height", "");
            }
            this.cards.push(card);
            this.cards.sort(card_sort_cmp);
            card.position_in_deck = _.indexOf(this.cards, card);

            card.on_added();
            // gfx work
            var affected_cards = _.last(this.cards,
                    this.cards.length - _.indexOf(this.cards, card) - 1);
            // Raise these cards and slide them over
            affected_cards.forEach(function(card) {
                card.position_in_deck += 1;
                card.el.css("z-index", card.position_in_deck + STARTING_Z);
                card.el.velocity({"left": CARD_OFFSET * card.position_in_deck});
            });
            card.el.css("z-index", card.position_in_deck + STARTING_Z);
            card.el.velocity({"left": CARD_OFFSET * card.position_in_deck});
            this.card_container.append(card.el);
        };

        Deck.prototype.remove_card = function(card_id) {
            if (this.cards.length === 1) {
                this.el.css("height", CARD_HEIGHT);
            }
            var removed_card_idx = _.findIndex(this.cards,
                    function(card) {return card.cid === card_id});
            if (removed_card_idx === -1) {
                console.log("Warning: card not found");
                return;
            }
            var removed_card = this.cards[removed_card_idx];
            removed_card.on_removed();

            // gfx work
            var affected_cards = _.last(this.cards, this.cards.length - removed_card_idx);
            // Raise these cards and slide them over
            affected_cards.forEach(function(card) {
                card.position_in_deck -= 1;
                console.log(card);
                card.el.css("z-index", card.position_in_deck + STARTING_Z);
                card.el.velocity({"left": CARD_OFFSET * card.position_in_deck});
            });
            removed_card.el.detach();
            this.cards = _.reject(this.cards, function(card) {return card.cid === card_id});
        };

        Deck.prototype._render = function() {
            this.card_container.empty();
            this.cards.forEach(function(card, idx) {
                card.el.css("z-index", STARTING_Z + idx);
                card.el.css("left", CARD_OFFSET * idx);
                this.card_container.append(card.el);
            }, this);
        };

        return Deck;
    }();

    return({
        "Card": Card,
        "Deck": Deck,
    });
});
