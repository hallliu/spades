// <reference path="../registration.ts" />
// <reference path="../global_state.ts" />
import assert = require("assert");
import mocha = require("mocha");
import sinon = require("sinon");
import express = require("express");
import Immutable = require("immutable");
import _ = require("underscore");

import {IGlobalState} from "../global_state";
import * as registration from "../registration";
import RoomInfo = require("../room_info");

interface IGlobalStateMock {
    get_room_info: Sinon.SinonStub;
    get_player_name: Sinon.SinonStub;
    get_room_of_player: Sinon.SinonStub;
    register_room: Sinon.SinonStub;
    update_room: Sinon.SinonStub;
    add_player_name: Sinon.SinonStub;
    change_player_name: Sinon.SinonStub;
    put_player_in_room: Sinon.SinonStub;
    associate_player_with_socket: Sinon.SinonStub;
    get_socket_id_mapping: Sinon.SinonStub;
    set_hand_for_room: Sinon.SinonStub;
    get_hand_for_room: Sinon.SinonStub;
}

class GlobalStateMock implements IGlobalState, IGlobalStateMock {
    get_room_info = sinon.stub();
    get_player_name = sinon.stub();
    get_room_of_player = sinon.stub();
    register_room = sinon.stub();
    update_room = sinon.stub();
    add_player_name = sinon.stub();
    change_player_name = sinon.stub();
    put_player_in_room = sinon.stub();
    associate_player_with_socket = sinon.stub();
    get_socket_id_mapping = sinon.stub();
    set_hand_for_room = sinon.stub();
    get_hand_for_room = sinon.stub();
}

function make_res_mock(): express.Response {
    var res = {
        json: sinon.stub(),
        status: sinon.stub(),
    };
    res.status.returns(res);
    return <any> res;
}

describe("User registration", function() {
    const player_name_1 = "poop";
    const player_name_2 = "poop1";
    const player_id_1 = "aaaaa";
    const player_id_2 = "bbbbb";
    const room_id_1 = "aaaab";

    var global_state: IGlobalStateMock;
    var res: express.Response;

    beforeEach(function() {
        global_state = new GlobalStateMock();
        res = make_res_mock();
    });

    function setup_existing_room(): RoomInfo {
        var existing_room = (new RoomInfo(room_id_1)).add_player(0, player_id_1);
        global_state.get_room_info.withArgs(room_id_1).returns(existing_room);
        global_state.get_player_name.withArgs(player_id_1).returns(player_name_1);
        return existing_room;
    }

    it("Test register new room", function() {
        var req: express.Request = <express.Request> {
            body: {
                name: player_name_1,
            }
        };

        registration.register_new_session(global_state, req, res);
        var response = (<Sinon.SinonSpy> res.json).getCall(0).args[0];
        var expected_room_id: string = response.room_id;
        var expected_player_id: string = response.player_uuid;
        assert.equal(response.player_position, 0);

        // verify player registration
        assert(global_state.add_player_name.getCall(0).calledWithExactly(expected_player_id, player_name_1));

        // verify room registration
        var registered_room: RoomInfo = global_state.register_room.getCall(0).args[0];
        assert.equal(registered_room.id, expected_room_id);
        assert.equal(registered_room.players.get(0), expected_player_id);
        assert(global_state.put_player_in_room.calledWithExactly(expected_player_id, expected_room_id));
    });

    it("Test adding player to room", function() {
        var req: express.Request = <express.Request> {
            body: {
                name: player_name_2,
                room_id: room_id_1,
            }
        };

        setup_existing_room();

        registration.register_player_to_room(global_state, req, res);

        var response = (<Sinon.SinonSpy> res.json).getCall(0).args[0];
        var new_player_id = response.player_uuid;
        assert.deepEqual(response.current_players, {
            0: {
                name: player_name_1,
                uuid: player_id_1, 
            }
        });
        
        assert(global_state.add_player_name.calledWithExactly(new_player_id, player_name_2));
        var modified_room = global_state.update_room.firstCall.args[0];
        assert(modified_room.speculative_players.has(new_player_id));
        clearTimeout(modified_room.speculative_players.get(new_player_id));
    });

    it("Add player to full room", function() {
        var req: express.Request = <express.Request> {
            body: {
                name: player_name_2,
                room_id: room_id_1
            }
        };

        var existing_room = setup_existing_room();
        sinon.stub(existing_room, "is_full").returns(true);

        registration.register_player_to_room(global_state, req, res);
        assert((<Sinon.SinonStub> res.status).calledWithExactly(409));
        assert((<Sinon.SinonSpy> res.json).firstCall.args[0].error.length > 0);
    });

    it("Choose valid position in room", function() {
        var position = 3;
        var room = setup_existing_room();
        var cst_stub = sinon.stub(room, "clear_speculative_timeout").returns(room);

        global_state.get_room_of_player.withArgs(player_id_2).returns(room_id_1);
        global_state.get_player_name.withArgs(player_id_2).returns(player_name_2);

        var response = registration.position_choice_handler(global_state, room_id_1, player_id_2, position);

        assert(cst_stub.calledWithExactly(player_id_2));
        assert(global_state.update_room.getCall(0).calledWithExactly(room));
        var new_room: RoomInfo = global_state.update_room.getCall(1).args[0];
        assert.equal(new_room.players.get(position), player_id_2);

        assert.equal(response.length, 2);
        var sj_message = _.find(response, (x)=>{return x.message === "successful_join"});
        var npj_message = _.find(response, (x)=>{return x.message === "new_player_joined"});
        assert.equal(npj_message.room, room_id_1);
        assert.deepEqual(npj_message.contents, sj_message.contents);
        var msg_contents = sj_message.contents;

        assert.deepEqual(msg_contents["current_players"][0], {
            uuid: player_id_1,
            name: player_name_1,
        });
        assert.deepEqual(msg_contents["current_players"][position], {
            uuid: player_id_2,
            name: player_name_2,
        });
        assert.equal(msg_contents["newly_joined_position"], position);
    });

    it("Chose full position in room", function() {
        var position = 0;
        var room = setup_existing_room();
        var cst_stub = sinon.stub(room, "clear_speculative_timeout").returns(room);

        global_state.get_room_of_player.withArgs(player_id_2).returns(room_id_1);
        global_state.get_player_name.withArgs(player_id_2).returns(player_name_2);

        var response = registration.position_choice_handler(global_state, room_id_1, player_id_2, position);

        assert(cst_stub.calledWithExactly(player_id_2));
        assert(global_state.update_room.getCall(0).calledWithExactly(room));
        var new_room: RoomInfo = global_state.update_room.getCall(1).args[0];
        assert(new_room.speculative_players.has(player_id_2));
        clearTimeout(new_room.speculative_players.get(player_id_2));

        assert.equal(response.length, 1);
        var pf_message = response[0];
        assert.equal(pf_message.message, "position_full");
        assert.deepEqual(pf_message.contents["current_players"], {
            0: {
                uuid: player_id_1,
                name: player_name_1,
            }
        });
    });
});
