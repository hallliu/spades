"use strict";

define(["velocity", "underscore"], function() {
    const BACK_ID = "3";
    var card_names = ["two", "three", "four", "five", "six", "seven", "eight", "nine",
            "ten", "jack", "queen", "king", "ace"];
    var suit_names = ["spades", "hearts", "clubs", "diamonds"];
    var Card = function(id_or_suit, number) {
        if (arguments.length === 1) {
            this.cid = id_or_suit;
            this.suit = suit_names[Math.floor(this.cid / 13)];
            this.number = card_names[this.cid % 13];
        } else {
            this.cid = 13 * suit_names.indexOf(id_or_suit) + card_names.indexOf(number);
            this.suit = id_or_suit;
            this.number = number;
        }
        this.card_element = $(_.template($("#card_template").html())({
            "suit": this.suit,
            "card": this.number,
            "back": BACK_ID,
        }));
        this.flipped = false;
    };

    Card.prototype.attach = function() {
        this.card_element.appendTo("#main-container");
    };

    Card.prototype.flip = function() {
        this.card_element.find(".card").velocity({"rotateY": this.flipped ? "0deg" : "180deg"});
        this.flipped = !this.flipped;
    };

    Card.prototype.slide_down = function() {
        this.card_element.velocity({"top": "200px"});
    }

    Card.prototype.slide_up= function() {
        this.card_element.velocity({"top": "0px"});
    }

    var sample_card = new Card(15);
    sample_card.attach();
    window.sample_card = sample_card;
});
