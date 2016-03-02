import assert = require("assert");
import mocha = require("mocha");
import _ = require("underscore");
import Immutable = require("immutable");

import RoomInfo = require("../room_info");
import {create_new_hand} from "../game_driver";
import {HandState} from "../hand_state";
import {IOMessage} from "../handlers";

describe("Game driver functionality testing", function() {
    it("Creating a new hand state", function() {
        let player_ids = ["a", "b", "c", "d"];
        let socket_ids = ["w", "x", "y", "z"];
        let room_info = new RoomInfo("test");
        _.each(player_ids, (id, idx) => {
            room_info = room_info.add_player(idx, id);
        });
        let player_to_socket = Immutable.Map<string, string>(_.zip(player_ids, socket_ids));
        
        let {hand, msgs} = create_new_hand(room_info, player_to_socket, true);
        for (let i = 0; i < 3; i++) {
            let msg = msgs[i];
            assert.equal(socket_ids[i], msg.room);
            assert.equal(msg.message, "start_game");
            assert.equal(msg.contents["cards"].length, 13);
        }
    });
});
