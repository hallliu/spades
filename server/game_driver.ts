import Immutable = require("immutable");
import _ = require("underscore");

import {HandState, HandStateFactory} from "./hand_state";
import RoomInfo = require("./room_info");
import {IOMessage} from "./handlers";

class DefaultFactory implements HandStateFactory {
    get(next_player = 0): HandState {
        return new HandState(this, next_player, true);
    }
    recycle(hs: HandState) {}
}

var factory = new DefaultFactory();

export function create_new_hand(room_info: RoomInfo, player_to_socket: Immutable.Map<string, string>,
                                new_game = false): {hand: HandState, msgs: IOMessage[]}  {
    let hand = factory.get(room_info.next_player);
    let msgs: IOMessage[] = _.map(hand.cards.keySeq().toArray(), (p_num: number) => {
        return {
            room: player_to_socket.get(room_info.players.get(p_num)),
            message: "start_game",
            contents: {
                cards: hand.cards.get(p_num).toArray(),
            }
        };
    });
    return {hand: hand, msgs: msgs};
}
