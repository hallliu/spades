// <reference path="../game_state.ts">

import assert = require("assert");
import mocha = require("mocha");
import * as HS from "../game_state";
import _ = require("underscore");
import Immutable = require("immutable");

class SampleHandStateFactory implements HS.HandStateFactory {
    get(next_player = 0): HS.HandState {
        return new HS.HandState(this, next_player, false);
    }
    recycle(hs: HS.HandState) {}
}

var default_factory = new SampleHandStateFactory();

function make_card_set(c1: number[], c2: number[], c3: number[], c4: number[]): HS.HandStateMembers {
    var cs = Immutable.Map<number, Immutable.Set<number>>();
    cs = cs.set(0, Immutable.Set<number>(c1));
    cs = cs.set(1, Immutable.Set<number>(c2));
    cs = cs.set(2, Immutable.Set<number>(c3));
    cs = cs.set(3, Immutable.Set<number>(c4));
    return {
        cards: cs
    };
}

function assert_card_played_by_player(state: HS.HandState, player: number, card: number) {
    assert(state.cards_in_play.get(player) === card || state.cards_in_play.size === 0);
    assert(!state.cards.get(player).contains(card))
}

function assert_player_won(old_state: HS.HandState, state: HS.HandState, player: number) {
    assert.equal(state.cards_in_play.size, 0);
    assert.equal(state.leading_suit, null);
    assert.equal(state.next_player, player);
    assert.equal(state.tricks.get(player), old_state.tricks.get(player) + 1);
}

describe("Game state transitions", function() {
    it("State initialization", function() {
        var state = new HS.HandState(default_factory);
        var cards = state.cards;
        var cunion = Immutable.Set();
        _.each([0, 1, 2, 3], function(idx) {
            assert.equal(cards.get(idx).size, 13);
            cunion = cunion.union(cards.get(idx));
        });
        assert.equal(cunion.size, 52);
        assert.equal(state.cards_in_play.size, 0);
        assert.equal(state.bids.size, 0);
        assert.equal(state.tricks.size, 4);
        assert.equal(state.tricks.max(), 0);
        assert.equal(state.tricks.min(), 0);
    });

    it("Detect out-of-order play", function() {
        var state = new HS.HandState(default_factory, 3);
        var {new_state, notes} = state.play_card(0, 14);
        assert.equal(new_state, null);
        assert.equal(notes, HS.HandStateNote.ERR_BAD_ORDER);
    });

    it("Detect play of non-existent card", function() {
        var cards = make_card_set([14, 16], [34, 12], [44, 11], [17, 23]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 0), cards);
        var {new_state, notes} = state.play_card(0, 15);
        assert.equal(new_state, null);
        assert.equal(notes, HS.HandStateNote.ERR_NO_SUCH_CARD);
    });

    it("Detect wrong suit being played", function() {
        var modifications = make_card_set([14, 46], [34, 12], [44, 11], [17, 23]);
        modifications.leading_suit = 1;
        var state = default_factory.get().copy(new HS.HandState(default_factory, 0), modifications);
        var {new_state, notes} = state.play_card(0, 46);
        assert.equal(new_state, null);
        assert.equal(notes, HS.HandStateNote.ERR_WRONG_SUIT);
    });

    it("Detect trying to lead spades before broken", function() {
        var modifications = make_card_set([1, 46], [34, 12], [44, 11], [17, 23]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 0), modifications);
        var {new_state, notes} = state.play_card(0, 1);
        assert.equal(new_state, null);
        assert.equal(notes, HS.HandStateNote.ERR_SPADES_UNBROKEN);
    });

    it("Lead spades after broken", function() {
        var modifications = make_card_set([1, 46], [34, 12], [44, 11], [17, 23]);
        modifications.spades_broken = true;
        var state = default_factory.get().copy(new HS.HandState(default_factory, 0), modifications);
        var {new_state, notes} = state.play_card(0, 1);
        assert_card_played_by_player(new_state, 0, 1);
        assert.equal(notes, null);
    });

    it("Lead ordinary card", function() {
        var modifications = make_card_set([19, 46], [34, 12], [44, 11], [17, 23]);
        modifications.spades_broken = true;
        var state = default_factory.get().copy(new HS.HandState(default_factory, 0), modifications);
        var {new_state, notes} = state.play_card(0, 19);
        assert_card_played_by_player(new_state, 0, 19);
        assert.equal(notes, null);
    });

    it("Play card in-suit", function() {
        var modifications = make_card_set([46], [34, 22], [44, 11], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 1), modifications);
        var {new_state, notes} = state.play_card(1, 22);
        assert_card_played_by_player(new_state, 1, 22);
        assert.equal(notes, null);
    });

    it("Play card out-of-suit for legit reasons", function() {
        var modifications = make_card_set([46], [34, 33], [44, 11], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 1), modifications);
        var {new_state, notes} = state.play_card(1, 33);
        assert_card_played_by_player(new_state, 1, 33);
        assert.equal(notes, null);
    });

    it("Break spades", function() {
        var modifications = make_card_set([46], [34, 3], [44, 11], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 1), modifications);
        var {new_state, notes} = state.play_card(1, 3);
        assert_card_played_by_player(new_state, 1, 3);
        assert(new_state.spades_broken && !state.spades_broken);
        assert.equal(notes, null);
    });

    it("Finish round -- all in-suit", function() {
        var modifications = make_card_set([46], [34], [44], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19], [1, 20], [2, 25]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 3), modifications);
        var {new_state, notes} = state.play_card(3, 23);
        assert_card_played_by_player(new_state, 3, 23);
        assert_player_won(state, new_state, 2);
        assert.equal(notes, HS.HandStateNote.NEXT_ROUND);
    });

    it("Finish round -- some out-of-suit", function() {
        var modifications = make_card_set([46], [34], [44], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19], [1, 40], [2, 45]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 3), modifications);
        var {new_state, notes} = state.play_card(3, 23);
        assert_card_played_by_player(new_state, 3, 23);
        assert_player_won(state, new_state, 3);
        assert.equal(notes, HS.HandStateNote.NEXT_ROUND);
    });

    it("Finish round -- with trumps", function() {
        var modifications = make_card_set([46], [34], [44], [17, 23]);
        modifications.leading_suit = 1;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 19], [1, 9], [2, 25]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 3), modifications);
        var {new_state, notes} = state.play_card(3, 23);
        assert_card_played_by_player(new_state, 3, 23);
        assert_player_won(state, new_state, 1);
        assert.equal(notes, HS.HandStateNote.NEXT_ROUND);
    });

    it("Finish round -- leading trumps", function() {
        var modifications = make_card_set([46], [34], [44], [17, 23]);
        modifications.leading_suit = 0;
        modifications.cards_in_play = Immutable.Map<number, number>([[0, 9], [1, 8], [2, 25]]);
        var state = default_factory.get().copy(new HS.HandState(default_factory, 3), modifications);
        var {new_state, notes} = state.play_card(3, 23);
        assert_card_played_by_player(new_state, 3, 23);
        assert_player_won(state, new_state, 0);
        assert.equal(notes, HS.HandStateNote.NEXT_ROUND);
    });
});
