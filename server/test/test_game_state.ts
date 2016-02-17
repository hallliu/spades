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
});
