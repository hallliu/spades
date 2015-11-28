"use strict";
define(["velocity", "underscore", "./Constants"], function(Velocity, _, Constants) {
    const BACK_ID = "3";

    var Card = function() {
        var Card = function(id_or_suit, number) {
            if (arguments.length === 1) {
                this.cid = id_or_suit;
                this.suit = Constants.SUIT_NAMES[Math.floor(this.cid / 13)];
                this.number = Constants.CARD_NAMES[this.cid % 13];
            } else {
                this.cid = 13 * Constants.SUIT_NAMES.indexOf(id_or_suit)
                        + Constants.CARD_NAMES.indexOf(number);
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
                this.el.velocity("stop");
                this.el.velocity({"top": this.el.data("orig-top") - 20},
                        {duration: Constants.CARD_PEEK_SPEED});
            }, this)).mouseleave(_.bind(function() {
                this.el.velocity("stop");
                this.el.velocity({"top": this.el.data("orig-top")},
                        {duration: Constants.CARD_PEEK_SPEED});
            }, this));
        };

        Card.prototype.on_removed = function() {
            this.el.off("mouseenter").off("mouseleave");
        };

        return Card;
    }();

    var Deck = function() {
        var card_sort_cmp = function(card_a, card_b) {
            return card_a.cid - card_b.cid;
        };

        // Helper function to calculate where a card should be.
        // Returns an object with top and left
        var calc_card_pos = function(deck_el, idx, num_cards) {
            var deck_top_pos = deck_el.position().top;
            var deck_left_pos = deck_el.position().left;
            
            var total_card_width = (num_cards - 1) * Constants.CARD_OFFSET + Constants.CARD_WIDTH;
            var left_offset_of_card_0 = (deck_el.width() - total_card_width) / 2;
            return {
                top: deck_top_pos + Constants.DECK_BORDER_THICKNESS,
                left: deck_left_pos + left_offset_of_card_0 + idx * Constants.CARD_OFFSET,
            };
        };

        var Deck = function(cards) {
            this.cards = cards || [];
            this.cards.sort(card_sort_cmp);

            this.el = $($("#deck_template").html());

            this.el.width(Constants.CARD_OFFSET * 13);
            this.el.height(Constants.CARD_HEIGHT + 2 * Constants.DECK_BORDER_THICKNESS);
        };

        Deck.prototype.attach = function() {
            this.el.appendTo("#main-container");
            this.el.css("position", "absolute");
            this.el.css("bottom", "0");
            this.cards.forEach(function(card, idx) {
                card.on_added();
            });
            this._render();
        };

        Deck.prototype.add_card = function(card) {
            this.cards.push(card);
            this.cards.sort(card_sort_cmp);
            var new_card_idx = _.indexOf(this.cards, card);

            card.on_added();
            card.attach();
            var new_card_position = calc_card_pos(this.el, new_card_idx, this.cards.length);
            card.el.css("top", new_card_position.top);
            card.el.css("left", new_card_position.left);
            this._update();
        };

        Deck.prototype.remove_card = function(card_id) {
            var removed_card_idx = _.findIndex(this.cards,
                    function(card) {return card.cid === card_id});
            if (removed_card_idx === -1) {
                console.log("Warning: card not found");
                return;
            }
            var removed_card = this.cards[removed_card_idx];
            this.cards = _.reject(this.cards, function(card) {return card.cid === card_id});
            removed_card.on_removed();
            removed_card.el.detach();
            this._update();
        };

        Deck.prototype._render = function() {
            this.cards.forEach(function(card, idx) {
                if (card.el.parent().length === 0) {
                    card.attach();
                }
                var card_position = calc_card_pos(this.el, idx, this.cards.length);
                card.el.css("z-index", Constants.STARTING_Z + idx);
                card.el.css("left", card_position.left);
                card.el.css("top", card_position.top);
                card.el.data("orig-top", card_position.top);
            }, this);
        };

        Deck.prototype._update = function() {
            this.cards.forEach(function(card, idx) {
                var card_position = calc_card_pos(this.el, idx, this.cards.length);
                card.el.css("z-index", Constants.STARTING_Z + idx);
                card.el.data("orig-top", card_position.top);
                card.el.velocity({"left": card_position.left});
                card.el.velocity({"top": card_position.top});
            }, this);
        };

        return Deck;
    }();

    return({
        "Card": Card,
        "Deck": Deck,
    });
});
