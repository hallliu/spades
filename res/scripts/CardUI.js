"use strict";
define(["velocity", "underscore", "./Constants", "./PlayArea", "PlayerInfoManager"],
       function(Velocity, _, Constants, PlayArea, PlayerInfoManager) {
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
            this.el.data("obj", this);
        };

        Card.prototype.flip = function(immediate) {
            if (immediate === true) {
                this.el.find(".card").css("transform", "rotateY(" + (this.flipped ? "0deg" : "180deg") + ")");
            } else {
                this.el.find(".card").velocity({"rotateY": this.flipped ? "0deg" : "180deg"});
            }
            this.flipped = !this.flipped;
            return this;
        };

        Card.prototype.attach_to_pile = function(pile_offset) {
            this.el.appendTo("#main-container");
            this.el.offset(pile_offset);
        };

        Card.prototype.on_added = function(deck, active) {
            this.deck = deck;
            if (active) {
                this.el.mouseenter(_.bind(function() {
                    this.el.velocity("finish");
                    this.el.velocity({"top": this.el.data("orig-top") - 20},
                            {duration: Constants.CARD_PEEK_SPEED});
                }, this)).mouseleave(_.bind(function() {
                    this.el.velocity("finish");
                    this.el.velocity({"top": this.el.data("orig-top")},
                            {duration: Constants.CARD_PEEK_SPEED});
                }, this));
                this.el.click(_.bind(function() {
                    this.put_in_play();
                }, this));
            }
        };

        Card.prototype.on_removed = function() {
            this.el.velocity("finish", true);
            this.el.off("mouseenter").off("mouseleave");
            this.reparent();
        };

        /**
         * Re-parents the card to be a child of the game board.
         */
        Card.prototype.reparent = function() {
            var old_offset = this.el.offset();
            var deck_transform = this.el.parent().css("transform");

            this.el.detach();
            this.el.appendTo("#main-container");
            this.el.css("transform", deck_transform);
            this.el.offset(old_offset);
        };

        Card.prototype.put_in_play = function() {
            this.deck.remove_card(this.cid);
            this.on_removed();
            var new_position = PlayArea.obtain().get_position_of_container(this.deck.board_position);
            var position = this.el.position();
            var p1 = Velocity.animate(this.el, {
                top: [new_position.top, position.top],
                left: [new_position.left, position.left],
                transform: "rotate(0deg)",
                rotateY: "0deg"
            }, {duration: Constants.CARD_PLAY_SPEED});

            p1.then(_.bind(function() {
                PlayArea.obtain().add_to_container(this, this.deck.board_position);
            }, this));
        };

        Card.prototype.remove_from_play = function(dest_position) {
            Velocity.animate(this.el, {
                top: dest_position.top,
                left: dest_position.left,
                opacity: 0,
            }, { display: "none" }).then(_.bind(function() {
                this.el.detach();
            }, this));
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
            var total_card_width = (num_cards - 1) * Constants.CARD_OFFSET + Constants.CARD_WIDTH;
            var left_offset_of_card_0 = (deck_el.width() - total_card_width) / 2;

            return {
                top: 0,
                left: left_offset_of_card_0 + idx * Constants.CARD_OFFSET,
            };
        };

        var calc_deck_pos = function(deck_el, parent, rotation) {
            var parent_height = parent.height();
            var parent_width = parent.width();

            var wh_diff = deck_el.width() / 2 - deck_el.height() / 2;

            var centered_left = (parent_width - deck_el.width()) / 2 - Constants.DECK_BORDER_THICKNESS;
            var centered_top = (parent_height - deck_el.width()) / 2 - Constants.DECK_BORDER_THICKNESS;

            switch (rotation) {
                case "bottom":
                    return {
                        top: parent_height - deck_el.height() - Constants.DECK_BORDER_THICKNESS * 2
                                - Constants.DECK_DIST_FROM_BOARD_EDGE,
                        left: centered_left,
                        rotation: 0,
                    };
                case "top":
                    return {
                        top: Constants.DECK_DIST_FROM_BOARD_EDGE + Constants.DECK_BORDER_THICKNESS,
                        left: centered_left,
                        rotation: 180,
                    };
                case "left":
                    return {
                        top: centered_top + wh_diff,
                        left: Constants.DECK_DIST_FROM_BOARD_EDGE - wh_diff + Constants.DECK_BORDER_THICKNESS,
                        rotation: 90,
                    };
                case "right":
                    return {
                        top: centered_top + wh_diff,
                        left: parent_width - deck_el.height()
                                - Constants.DECK_DIST_FROM_BOARD_EDGE - wh_diff - Constants.DECK_BORDER_THICKNESS * 2,
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

            this.container_el = $($("#deck_template").html());
            this.el = this.container_el.find(".deck");

            this.el.width(Constants.CARD_OFFSET * 12 + Constants.CARD_WIDTH);
            this.el.height(Constants.CARD_HEIGHT);

            this.container_el.css("max-height", Constants.CARD_HEIGHT + 5);

            var player_info_el = this.container_el.find(".player-info-area");
            player_info_el.width(Constants.PLAYER_INFO_WIDTH);
            player_info_el.height(Constants.CARD_HEIGHT);
            PlayerInfoManager.obtain().register_info_area(position, player_info_el, this.el);
        };

        Deck.prototype.attach = function() {
            this.container_el.css("position", "absolute");
            this.container_el.appendTo("#main-container");
            
            var calculated_position = calc_deck_pos(this.container_el,
                    $("#main-container"), this.board_position);
            this.container_el.css("top", calculated_position.top);
            this.container_el.css("left", calculated_position.left);
            this.rotate(calculated_position.rotation);

            this.cards.forEach(function(card, idx) {
                card.on_added(this, this.is_active);
            }, this);
            this._render();
        };

        Deck.prototype.initialize_with_cards = function(cards) {
            this.cards = cards;
            this.cards.sort(card_sort_cmp);
            this.cards.forEach(function(card, idx) {
                card.on_added(this, this.is_active);
                if (card.el.parent().length === 0) {
                    card.el.appendTo(this.el);
                    card.el.position({top: 0, left: 0});
                }
            }, this);
            return this._update(1000);
        };

        Deck.prototype.flip_all_cards = function() {
            _.each(this.cards, function(card, idx) {
                setTimeout(function() {
                    card.flip(false);
                }, idx * 30);
            });
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
            this._update(Constants.CARD_PLAY_SPEED);
        };

        Deck.prototype.rotate = function(angle) {
            var angle1 = "rotate(" + angle + "deg)";
            var angle2 = "rotate(-" + angle + "deg)";
            this.container_el.css("transform", angle1);
            this.container_el.find(".player-info-area").css("transform", angle2);
        };

        Deck.prototype._render = function() {
            this.cards.forEach(function(card, idx) {
                if (card.el.parent().length === 0) {
                    card.el.appendTo(this.el);
                }
                this._update_card(idx, 0);
            }, this);
        };

        Deck.prototype._update = function(duration) {
            var card_animations = [];
            this.cards.forEach(function(card, idx) {
                card_animations.push(this._update_card(idx, duration));
            }, this);
            return Promise.all(card_animations);
        };

        Deck.prototype._update_card = function(idx, animate_duration) {
            var card = this.cards[idx];
            var card_position = calc_card_pos(this.el, idx, this.cards.length);
            card.el.css("z-index", Constants.STARTING_Z + idx);
            card.el.data("orig-top", card_position.top);
            if (animate_duration > 0) {
                return Velocity.animate(card.el, {"left": card_position.left, "top": card_position.top},
                        {duration: animate_duration});
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
