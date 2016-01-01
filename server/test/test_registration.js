"use strict";

const Immutable = require("immutable");
const IMap = Immutable.Map;
const test = require("unit.js");
const _ = require("underscore");

const registration = require("../registration.js");

const assert = test.assert;


const player_to_room = IMap();
const player_to_name = IMap();
const room_to_details = IMap();

const player_name = "test_player_name";

describe("User registration", function() {
    const create_populated_rooms = function() {
        var req = {body: {name: player_name}};
        var res = {json: function() {}};

        return registration.register_new_session(player_to_room, room_to_details,
                player_to_name, req, res);
    };

    it("Register new session/room", function() {
        var req = {body: {name: player_name}};
        var res = {json: test.spy()};

        var [npr, nrd, npn] = registration.register_new_session(player_to_room, room_to_details,
                player_to_name, req, res);

        assert.strictEqual(npr.size, 1);
        var [player_id, room_id] = npr.entries().next().value;
        assert.strictEqual(npn.size, 1);
        assert.strictEqual(npn.get(player_id), player_name);

        assert.strictEqual(nrd.size, 1);
        assert(nrd.get(room_id) instanceof IMap);

        var room_details = nrd.get(room_id);
        assert(room_details.get("speculative_players") instanceof IMap);
        assert(room_details.get("players") instanceof IMap);
        assert(room_details.get("teams") instanceof IMap);
        assert(room_details.has("last_active"));
        assert.strictEqual(room_details.getIn(["players", 0]), player_id);

        test.sinon.assert.calledWith(res.json, test.sinon.match({
            room_id: room_id,
            player_uuid: player_id,
            player_position: 0,
        }));
    });

    it("Add player to non-existent room", function() {
        var req = {
            body: {
                name: player_name,
                room_id: "obv invalid room id",
            }
        };
        var res = {
            json: test.spy()
        };
        res.status = test.stub().returns(res);

        registration.register_player_to_room(player_to_room, room_to_details,
                player_to_name, _.noop, req, res);
        test.sinon.assert.calledWith(res.status, 404);
        test.sinon.assert.calledWith(res.json, test.sinon.match.object);
    });

    it("Add player to full room", function() {
        var x_player_name = player_name + "x";
        var [ptr, rtd, ptn] = create_populated_rooms();

        var room_id = rtd.keys().next().value;
        var req = {
            body: {
                name: x_player_name,
                room_id: room_id,
            }
        };
        var res = {
            json: test.spy()
        };
        res.status = test.stub().returns(res);
        rtd = rtd.mergeIn([room_id, "players"], {1: "p1", 2: "p2", 3: "p3"});
        registration.register_player_to_room(ptr, rtd, ptn, _.noop, req, res);
        test.sinon.assert.calledWith(res.status, 409);
        test.sinon.assert.calledWith(res.json, test.sinon.match.object);
    });

    it("Add player to normal room", function() {
        var x_player_name = player_name + "x";
        var [ptr, rtd, ptn] = create_populated_rooms();

        var room_id = rtd.keys().next().value;
        var req = {
            body: {
                name: x_player_name,
                room_id: room_id,
            }
        };
        var res = {
            json: test.spy()
        };
        res.status = test.stub().returns(res);
        var make_timeout = test.stub().returns("TIMEOUT");

        var [ptr, rtd, ptn] = registration.register_player_to_room(ptr, rtd, ptn, make_timeout, req, res);

        var this_player_id = res.json.args[0][0].player_uuid;
        var submitted_player_info = res.json.args[0][0].current_players;

        assert.strictEqual(_.size(submitted_player_info), 1);
        assert(_.has(submitted_player_info, 0));
        assert.strictEqual(submitted_player_info[0].name, player_name);
        assert.notEqual(this_player_id, submitted_player_info[0].uuid);
        
        assert.strictEqual(ptn.get(this_player_id), x_player_name);
        assert.strictEqual(ptr.get(this_player_id), room_id);
        assert.strictEqual(rtd.getIn([room_id, "speculative_players", this_player_id]), "TIMEOUT");
    });
});
