import Immutable = require("immutable");
import _ = require("underscore");

import {HandState, HandStateFactory, HandStateNote} from "./hand_state";
import RoomInfo = require("./room_info");
import {IOMessage} from "./handlers";

class DefaultFactory implements HandStateFactory {
    get(next_player = 0): HandState {
        return new HandState(this, next_player, true);
    }
    recycle(hs: HandState) {}
}

const NOTE_TO_ERR_MSG: Immutable.Map<HandStateNote, string> = Immutable.Map<HandStateNote, string>([
    [HandStateNote.ERR_BAD_ORDER, "It is not your turn to play."],
    [HandStateNote.ERR_NO_SUCH_CARD, "You do not have the card in your hand."],
    [HandStateNote.ERR_OTHER, "Undefined error."],
    [HandStateNote.ERR_SPADES_UNBROKEN, "You cannot lead spades before it has been broken."],
    [HandStateNote.ERR_WRONG_SUIT, "You must follow the leading suit."]
]);

export var factory = new DefaultFactory();

export function create_new_hand(room_info: RoomInfo, new_game = false):
        {hand: HandState, msgs: IOMessage[]} {
    let hand = factory.get(room_info.next_player);
    let msgs: IOMessage[] = _.map(hand.cards.keySeq().toArray(), (p_num: number) => {
        return {
            room: room_info.players.get(p_num),
            message: "start_game",
            contents: {
                cards: hand.cards.get(p_num).toArray(),
            }
        };
    });
    msgs.push({
        room: room_info.id,
        message: "bid_round",
        contents: {
            bidding_user: hand.next_player
        }
    });
    return {hand: hand, msgs: msgs};
}

export function handle_play_card(room: RoomInfo, hand: HandState, player_id: string, card: number):
    [HandState, IOMessage[]] {
    let player_position: number = room.players.findEntry((id: string) => {return id === player_id})[0];
    let result = hand.play_card(player_position, card);

    let new_hand: HandState = null;
    let msgs: IOMessage[] = [];
    if (result.new_state === null) {
        let error_message = NOTE_TO_ERR_MSG.get(result.notes);
        msgs.push({
            message: "invalid_play",
            contents: {
                reason: error_message,
            }
        });
        new_hand = hand;
    } else {
        new_hand = result.new_state;
        msgs.push({
            room: room.id,
            message: "play_made",
            contents: {
                card: card,
                leading_suit: new_hand.leading_suit,
            },
        });
    }

    if (result.notes === HandStateNote.NEXT_ROUND) {
        if (new_hand.is_empty()) {
            // TODO: handle scoring here.
            return [null, []];
        }
        msgs.push({
            room: room.id,
            message: "end_of_trick",
            contents: {
                winner: new_hand.next_player,
            },
        });
    }
    
    msgs.push({
        room: room.players.get(new_hand.next_player),
        message: "make_play",
        contents: {},
    });

    return [new_hand, msgs];
}



export function handle_player_bid(room_info: RoomInfo, player_id: string,
                                  hand: HandState, bid_value: number):
        {hand: HandState, msgs: IOMessage[]} {
    let player_position: number = room_info.players.findEntry((id: string) => {return id === player_id})[0];
    let {new_state, fail_reason} = hand.make_bid(player_position, bid_value);
    
    let new_hand = new_state === null ? hand : new_state;
    let msgs: IOMessage[] = []
    if (new_state === null) {
        msgs.push({
            message: "invalid_bid",
            contents: {
                reason: fail_reason
            }
        });
    } else {
        msgs.push({
            room: room_info.id,
            message: "user_bid",
            contents: {
                bidding_user: player_position,
                bid: bid_value
            }
        });
    }

    if (new_state && new_hand.bids.size === 4) {
        msgs.push({
            room: room_info.players.get(new_hand.next_player),
            message: "make_play",
            contents: {},
        });
    } else if (new_state) {
        msgs.push({
            room: room_info.id,
            message: "bid_round",
            contents: {
                bidding_user: new_hand.next_player,
            },
        });
    }
    return {hand: new_hand, msgs: msgs};
}
