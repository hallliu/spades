// <reference path="../registration.ts" />
// <reference path="../global_state.ts" />
import assert = require("assert");
import mocha = require("mocha");
import sinon = require("sinon");
import express = require("express");
import {IGlobalState} from "../global_state";
import * as registration from "../registration";

describe("User registration", function() {
    it("Sample test case", function() {
        var sample_player_name = "poop";
        var req: express.Request = <express.Request> {
            body: {
                name: sample_player_name
            }
        };
        var _res = sinon.mock({});
        _res.expects("json").once();
        var res: express.Response = <express.Response> <any> _res;
        var _global_state = sinon.mock({});
        var global_state: IGlobalState =  <IGlobalState> <any> _global_state;

        registration.register_new_session(global_state, req, res);
    });
});
