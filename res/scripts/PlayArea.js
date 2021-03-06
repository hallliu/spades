"use strict";

define(["underscore", "./Constants"], function(_, Constants) {
    var obtain = function() {
        var play_area_singleton;

        var calculate_new_loc = function(new_pos) {
            var vert_center_top = $("#main-container").height() / 2
                - Constants.CARD_HEIGHT / 2;
            var horiz_center_left = $("#main-container").width() / 2
                - Constants.CARD_WIDTH / 2;
            switch (new_pos) {
                case 'top':
                    return {
                        top: -Constants.CARD_HEIGHT,
                        left: horiz_center_left,
                    };
                case 'bottom':
                    return {
                        top: $("#main-container").height(),
                        left: horiz_center_left,
                    };
                case 'left':
                    return {
                        top: vert_center_top,
                        left: -Constants.CARD_WIDTH,
                    };
                case 'right':
                    return {
                        top: vert_center_top,
                        left: $("#main-container").width(),
                    };
            }
        };

        /**
         * @constructor
         */
        var PlayArea = function() {
            this.el = $("#play-area");
            this.cards = {};
            this.suit = null;
        };

        PlayArea.prototype.set_suit = function(suit) {
            this.suit = suit;
            var suit_str = Constants.SUIT_NAMES[suit];

            switch (suit_str) {
                case "spades":
                    $("#active-suit").css("color", "black");
                    $("#active-suit").html("&spades;");
                    return;
                case "hearts":
                    $("#active-suit").css("color", "red");
                    $("#active-suit").html("&hearts;");
                    return;
                case "clubs":
                    $("#active-suit").css("color", "black");
                    $("#active-suit").html("&clubs;");
                    return;
                case "diamonds":
                    $("#active-suit").css("color", "red");
                    $("#active-suit").html("&diams;");
                    return;
            }
        };

        PlayArea.prototype.get_position_of_container = function(container_position) {
            var holder_position = $("#" + container_position + "-played-card").position();
            var play_area_position = this.el.position();
            return {
                top: holder_position.top + play_area_position.top + 2,
                left: holder_position.left + play_area_position.left + 2,
            };
        };
        
        PlayArea.prototype.add_to_container = function(card, container_position) {
            /* Is this really necessary?
            var old_offset = card.el.offset();
            card.el.appendTo($("#" + container_position + "-played-card"));
            card.el.offset(old_offset);
            */
            this.cards[container_position] = card;
            if (this.suit === null) {
                this.set_suit(Math.floor(card.cid / 13));
            }
        };

        /**
         * Clears the play area by sweeping cards away.
         * @param direction: one of 'top', 'bottom', 'left', or 'right'
         */
        PlayArea.prototype.clear = function(direction) {
            this.suit = null;
            $("#active-suit").empty();
            var dest_position = calculate_new_loc(direction);
            ['bottom', 'top', 'left', 'right'].forEach(function(card_loc) {
                if (this.cards[card_loc] === undefined) {
                    return;
                }
                var card = this.cards[card_loc];
                this.cards[card_loc] = undefined;
                card.remove_from_play(dest_position);
            }, this);
        };

        PlayArea.prototype.get_pile_offset = function() {
            var offset = $("#top-played-card").offset();
            offset.top += Constants.CARD_HEIGHT + 6;
            offset.left += 2;
            return offset;
        };

        var obtain = function() {
            play_area_singleton = play_area_singleton || new PlayArea();
            return play_area_singleton;
        };

        return obtain;
    }();

    return {
        obtain: obtain,
    };
});
