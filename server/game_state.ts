import Immutable = require("immutable");
import _ = require("underscore");

interface HandStateMembers {
    cards: Immutable.Map<number, Immutable.Set<number>>;
    cards_in_play: Immutable.Map<number, number>; 
    bids: Immutable.Map<number, number>;
    tricks: Immutable.Map<number, number>;
    next_player: number;
}

interface HandStateFactory {
    get(next_player?: number): HandState;
    recycle(hs: HandState): void;
}

class HandState {
    private _cards: Immutable.Map<number, Immutable.Set<number>>;
    private _cards_in_play: Immutable.Map<number, number>; 
    private _bids: Immutable.Map<number, number>;
    private _tricks: Immutable.Map<number, number>;
    private _next_player: number;
    private factory: HandStateFactory;

    constructor(factory: HandStateFactory, next_player?: number, init = true) {
        this.factory = factory;
        if (!init) {
            return;
        }
        if (!next_player) {
            next_player = _.random(4);
        }
        var all_cards: number[] = _.range(52);
        _.shuffle(all_cards);
        this._cards = Immutable.Map<number, Immutable.Set<number>>();
        this._cards.withMutations(cards => {
            for (var i: number = 0; i < 4; i++) {
                cards.set(i, Immutable.Set(all_cards.slice(i * 13, (i + 1) * 13)));
            }
        });
        this._cards_in_play = Immutable.Map<number, number>();
        this._bids = Immutable.Map<number, number>();
        this._tricks = Immutable.Map<number, number>();
    }

    get cards() {
        return this._cards;
    }

    get cards_in_play() {
        return this._cards_in_play;
    }

    get bids() {
        return this._bids;
    }

    get tricks() {
        return this._tricks;
    }

    get next_player() {
        return this._next_player;
    }

    copy(other: HandState, modifications: HandStateMembers): HandState {
        this._cards = modifications.cards || other.cards;
        this._cards_in_play = modifications.cards_in_play || other.cards_in_play;
        this._bids = modifications.bids || other.bids;
        this._tricks = modifications.tricks || other.tricks;
        this._next_player = modifications.next_player || other.next_player;
        return this;
    }

    play_card(player: number, card: number): HandState {
        if (!this._cards.hasIn([player, card])) {
            return null;
        }
    }
}
