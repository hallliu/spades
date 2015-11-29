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

        Card.prototype.flip = function() {
            this.el.find(".card").velocity({"rotateY": this.flipped ? "0deg" : "180deg"});
            this.flipped = !this.flipped;
        };

        Card.prototype.on_added = function(active) {
            if (active) {
                this.el.mouseenter(_.bind(function() {
                    this.el.velocity("stop");
                    this.el.velocity({"top": this.el.data("orig-top") - 20},
                            {duration: Constants.CARD_PEEK_SPEED});
                }, this)).mouseleave(_.bind(function() {
                    this.el.velocity("stop");
                    this.el.velocity({"top": this.el.data("orig-top")},
                            {duration: Constants.CARD_PEEK_SPEED});
                }, this));
                this.el.click(_.bind(function() {
                    this.reparent();
                }, this));
            }
        };

        Card.prototype.on_removed = function() {
            this.el.velocity("stop");
            this.el.off("mouseenter").off("mouseleave");
        };

        /**
         * Re-parents the card to be a child of the game board.
         */
        Card.prototype.reparent = function() {
            this.on_removed();
            var old_offset = this.el.offset();
            var deck_transform = this.el.parent().css("transform");

            this.el.detach();
            this.el.appendTo("#main-container");
            this.el.css("transform", deck_transform);
            this.el.offset(old_offset);
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
            /* *** This is for when card's parent is the game board ***

            var deck_top_pos = deck_el.position().top;
            var deck_left_pos = deck_el.position().left;
            
            var total_card_width = (num_cards - 1) * Constants.CARD_OFFSET + Constants.CARD_WIDTH;
            var left_offset_of_card_0 = (deck_el.width() - total_card_width) / 2;
            return {
                top: deck_top_pos + Constants.DECK_BORDER_THICKNESS,
                left: deck_left_pos + left_offset_of_card_0 + idx * Constants.CARD_OFFSET,
            }; */
            
            /* *** This is for when the card's parent is the deck.el *** */
            var total_card_width = (num_cards - 1) * Constants.CARD_OFFSET + Constants.CARD_WIDTH;
            var left_offset_of_card_0 = (deck_el.width() - total_card_width) / 2;

            return {
                top: 0,
                left: left_offset_of_card_0 + idx * Constants.CARD_OFFSET,
            };
        };

        var calc_deck_pos = function(deck_el, rotation) {
            var parent_height = deck_el.parent().height();
            var parent_width = deck_el.parent().width();
            var parent_pos = deck_el.parent().position();

            var wh_diff = deck_el.width() / 2 - deck_el.height() / 2;

            var centered_left = (parent_width - deck_el.width()) / 2;
            var centered_top = (parent_height - deck_el.width()) / 2;

            switch (rotation) {
                case "bottom":
                    return {
                        top: parent_height - deck_el.height()
                                - Constants.DECK_DIST_FROM_BOARD_EDGE,
                        left: centered_left,
                        rotation: 0,
                    };
                case "top":
                    return {
                        top: Constants.DECK_DIST_FROM_BOARD_EDGE,
                        left: centered_left,
                        rotation: 180,
                    };
                case "left":
                    return {
                        top: centered_top + wh_diff,
                        left: Constants.DECK_DIST_FROM_BOARD_EDGE - wh_diff,
                        rotation: 90,
                    };
                case "right":
                    return {
                        top: centered_top + wh_diff,
                        left: parent_width - deck_el.height()
                                - Constants.DECK_DIST_FROM_BOARD_EDGE - wh_diff,
                        rotation: 270,
                    };
                default:
                    console.log("invalid rotation: " + rotation);
                    return deck_el.position();
            }
        };

        /**
         * Represents a deck of cards
         * @constructor
         * @param cards - An array of Card object to initialize the cards with.
         * @param position - 'bottom', 'left', 'right', or 'top'
         * @param is_active - true if the deck is the player's deck, false otherwise.
         */
        var Deck = function(cards, position, is_active) {
            this.cards = cards || [];
            this.is_active = is_active;
            this.board_position = position;

            this.cards.sort(card_sort_cmp);

            this.el = $($("#deck_template").html());

            this.el.width(Constants.CARD_OFFSET * 12 + Constants.CARD_WIDTH);
            this.el.height(Constants.CARD_HEIGHT + 2 * Constants.DECK_BORDER_THICKNESS);
        };

        Deck.prototype.attach = function() {
            this.el.appendTo("#main-container");
            this.el.css("position", "absolute");
            
            var calculated_position = calc_deck_pos(this.el, this.board_position);
            this.el.css("top", calculated_position.top);
            this.el.css("left", calculated_position.left);
            this.rotate(calculated_position.rotation);

            this.cards.forEach(function(card, idx) {
                card.on_added(this.is_active);
            }, this);
            this._render();
        };

        Deck.prototype.add_card = function(card) {
            this.cards.push(card);
            this.cards.sort(card_sort_cmp);
            var new_card_idx = _.indexOf(this.cards, card);

            card.on_added(this.is_active);
            card.el.appendTo(this.el);
            this._update_card(new_card_idx, false);
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

        Deck.prototype.rotate = function(angle) {
            angle = "rotate(" + angle + "deg)";
            this.el.css("transform", angle);
        };

        Deck.prototype._render = function() {
            this.cards.forEach(function(card, idx) {
                if (card.el.parent().length === 0) {
                    card.el.appendTo(this.el);
                }
                this._update_card(idx, false);
            }, this);
        };

        Deck.prototype._update = function() {
            this.cards.forEach(function(card, idx) {
                this._update_card(idx, true);
            }, this);
        };

        Deck.prototype._update_card = function(idx, animate) {
            var card = this.cards[idx];
            var card_position = calc_card_pos(this.el, idx, this.cards.length);
            card.el.css("z-index", Constants.STARTING_Z + idx);
            card.el.data("orig-top", card_position.top);
            if (animate) {
                card.el.velocity({"left": card_position.left});
                card.el.velocity({"top": card_position.top});
            } else {
                card.el.css("left", card_position.left);
                card.el.css("top", card_position.top);
            }
        };

        return Deck;
    }();

    return({
        "Card": Card,
        "Deck": Deck,
    });
});
