import assert = require("assert");
import mocha = require("mocha");
import sinon = require("sinon");
import _ = require("underscore");
import Immutable = require("immutable");

import RoomInfo = require("../room_info");
import {factory, create_new_hand, handle_player_bid} from "../game_driver";
import {HandState} from "../hand_state";
import {IOMessage} from "../handlers";

describe("Game driver functionality testing", function() {
    let player_ids = ["a", "b", "c", "d"];
    function setup_sample_room(room_id: string): RoomInfo {
        let room_info = new RoomInfo("test");
        _.each(player_ids, (id, idx) => {
            room_info = room_info.add_player(idx, id);
        });
        return room_info;
    }

    it("Creating a new hand state", function() {
        let room_info = setup_sample_room("test");
        
        let {hand, msgs} = create_new_hand(room_info, true);
        for (let i = 0; i < 4; i++) {
            let msg = msgs[i];
            assert.equal(player_ids[i], msg.room);
            assert.equal(msg.message, "start_game");
            assert.equal(msg.contents["cards"].length, 13);
        }
        let bid_msg = msgs[4];
        assert.equal(bid_msg.room, room_info.id);
        assert.equal(bid_msg.message, "bid_round");
        assert.equal(bid_msg.contents["bidding_user"], room_info.next_player);
    });

    it("Making a successful bid", function() {
        let hs = new HandState(factory, 0, true);
        let hs1 = new HandState(factory, 1, true);
        sinon.stub(hs, "make_bid").returns({
            new_state: hs1,
            fail_reason: null
        });
        let room_info = setup_sample_room("test");
        let {hand, msgs} = handle_player_bid(room_info, player_ids[0], hs, 5);
        assert.strictEqual(hand, hs1);
        assert.equal(msgs.length, 1);
        assert.equal(msgs[0].room, "test");
        assert.equal(msgs[0].message, "user_bid");
        assert.equal(msgs[0].contents["bidding_user"], 0);
        assert.equal(msgs[0].contents["bid"], 5);
    });

    it("Making a successful final bid", function() {
        let hs = new HandState(factory, 0, true);
        let hs1 = factory.get().copy(new HandState(factory, 1, true), {
            bids: Immutable.Map<number, number>([[0, 1], [1, 2], [2, 3], [3, 4]]),
        });
        sinon.stub(hs, "make_bid").returns({
            new_state: hs1,
            fail_reason: null
        });
        let room_info = setup_sample_room("test");
        let {hand, msgs} = handle_player_bid(room_info, player_ids[0], hs, 5);
        assert.strictEqual(hand, hs1);
        assert.equal(msgs.length, 2);
        assert.equal(msgs[1].room, player_ids[1]);
        assert.equal(msgs[1].message, "make_play");
    });

    it("Making an unsuccessful bid", function() {
        let hs = new HandState(factory, 0, true);
        let fail_reason = "blah blah";
        sinon.stub(hs, "make_bid").returns({
            new_state: null,
            fail_reason: fail_reason
        });
        let room_info = setup_sample_room("test");
        let {hand, msgs} = handle_player_bid(room_info, player_ids[0], hs, 5);
        assert.equal(msgs.length, 1);
        assert.equal(msgs[0].room, undefined);
        assert.equal(msgs[0].message, "invalid_bid");
        assert.equal(msgs[0].contents["reason"], fail_reason);
    });
});
