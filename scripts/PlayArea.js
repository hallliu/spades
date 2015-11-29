"use strict";

define(["underscore", "./Constants"], function(_, Constants) {
    var obtain = function() {
        var play_area_singleton;
        /**
         * @constructor
         */
        var PlayArea = function() {
            this.el = $("#play-area");
            this.cards = {};

            // Making side-effects here because this is a singleton to be initialized at game start
            this.el.css("left", ($("#main-container").width() - this.el.width()) / 2);
            this.el.css("top", ($("#main-container").height() - this.el.height()) / 2);
        };

        PlayArea.prototype.set_suit = function(suit) {
            if (parseInt(suit) === suit) {
                suit = Constants.SUIT_NAMES[suit];
            }
            switch (suit) {
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
            var old_offset = card.el.offset();
            card.el.appendTo($("#" + container_position + "-played-card"));
            card.el.offset(old_offset);
            this.cards[container_position] = card;
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
