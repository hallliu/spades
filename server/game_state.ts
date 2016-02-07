import Immutable = require("immutable");
import _ = require("underscore");

interface HandStateMembers {
    cards?: Immutable.Map<number, Immutable.Set<number>>;
    cards_in_play?: Immutable.Map<number, number>; 
    bids?: Immutable.Map<number, number>;
    tricks?: Immutable.Map<number, number>;
    next_player?: number;
    leading_suit?: number;
    spades_broken?: boolean;
}

export enum HandStateNote{
    ERR_BAD_ORDER,
    ERR_OTHER,
    ERR_NO_SUCH_CARD,
    ERR_WRONG_SUIT,
    ERR_SPADES_UNBROKEN,
    NEXT_ROUND,
}

export interface HandStateFactory {
    get(next_player?: number): HandState;
    recycle(hs: HandState): void;
}

export interface HSResponse {
    new_state: HandState,
    notes: HandStateNote,
}


const SPADES_SUIT: number = 0;

function get_suit_of_card(card: number): number {
    return Math.floor(card / 13);
}

function does_hand_have_suit(hand: Immutable.Set<number>, suit: number): boolean {
   if (hand.find(card => get_suit_of_card(card) == suit) != null) {
       return true;
   } else {
       return false;
   }
}

function get_winning_player(cards: Immutable.Map<number, number>, leading_suit: number): number {
    var spades_cards = cards.filter(c => get_suit_of_card(c) == SPADES_SUIT);
    if (spades_cards.size > 0) {
        return cards.keyOf(spades_cards.max());
    }
    var leading_suit_cards = cards.filter(c => get_suit_of_card(c) == leading_suit);
    return cards.keyOf(leading_suit_cards.max());
}

export class HandState {
    private _cards: Immutable.Map<number, Immutable.Set<number>>;
    private _cards_in_play: Immutable.Map<number, number>; 
    private _bids: Immutable.Map<number, number>;
    private _tricks: Immutable.Map<number, number>;
    private _next_player: number;
    private _leading_suit: number;
    private _spades_broken: boolean;
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
        this._cards = Immutable.Map<number, Immutable.Set<number>>().withMutations(cards => {
            for (var i: number = 0; i < 4; i++) {
                cards.set(i, Immutable.Set(all_cards.slice(i * 13, (i + 1) * 13)));
            }
        });
        this._cards_in_play = Immutable.Map<number, number>();
        this._bids = Immutable.Map<number, number>();
        this._tricks = Immutable.Map<number, number>([[0, 0], [1, 0], [2, 0], [3, 0]]);

        this._leading_suit = null;
        this._spades_broken = false;
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

    get leading_suit() {
        return this._leading_suit;
    }

    get spades_broken() {
        return this._spades_broken;
    }

    copy(other: HandState, modifications: HandStateMembers): HandState {
        this._cards = modifications.cards || other.cards;
        this._cards_in_play = modifications.cards_in_play || other.cards_in_play;
        this._bids = modifications.bids || other.bids;
        this._tricks = modifications.tricks || other.tricks;
        this._next_player = modifications.next_player || other.next_player;
        this._leading_suit = modifications.leading_suit || other.leading_suit;
        this._spades_broken = modifications.spades_broken || other._spades_broken;
        return this;
    }

    play_card(player: number, card: number): HSResponse {
        if (player != this._next_player) {
            return {new_state: null, notes: HandStateNote.ERR_BAD_ORDER};
        }
        
        if (this._cards_in_play.has(player)) {
            return {new_state: null, notes: HandStateNote.ERR_OTHER};
        }

        var players_hand = this._cards.get(player);

        if (!players_hand.has(card)) {
            return {new_state: null, notes: HandStateNote.ERR_NO_SUCH_CARD};
        }
        if (this._leading_suit != null
                && get_suit_of_card(card) != this._leading_suit
                && does_hand_have_suit(players_hand, this._leading_suit)) {
            return {new_state: null, notes: HandStateNote.ERR_WRONG_SUIT};
        }
        if (get_suit_of_card(card) == SPADES_SUIT
                && this._leading_suit == null
                && !this._spades_broken) {
            return {new_state: null, notes: HandStateNote.ERR_SPADES_UNBROKEN};
        }

        if (this._cards_in_play.size == 3) {
            return this.complete_round(player, card);
        }

        var modifications: HandStateMembers = {};
        if (this._leading_suit == null) {
            modifications.leading_suit = get_suit_of_card(card);
        }
        if (!this._spades_broken && get_suit_of_card(card) == SPADES_SUIT) {
            modifications.spades_broken = true;
        }

        modifications.cards = this._cards.deleteIn([player, card]);
        modifications.cards_in_play = this._cards_in_play.set(player, card);
        modifications.next_player = (this._next_player + 1) % 4;
        return {new_state: this.factory.get().copy(this, modifications), notes: null};
    }

    private complete_round(player: number, card: number) {
        var modifications: HandStateMembers = {};

        if (!this._spades_broken && get_suit_of_card(card) == SPADES_SUIT) {
            modifications.spades_broken = true;
        }

        modifications.cards = this._cards.deleteIn([player, card]);
        modifications.cards_in_play = this._cards_in_play.clear();
        modifications.leading_suit = null;

        var winner = get_winning_player(this._cards_in_play.set(player, card), this._leading_suit);
        modifications.tricks = this._tricks.update(winner, x => x + 1);
        modifications.next_player = winner;

        return {new_state: this.factory.get().copy(this, modifications), notes: HandStateNote.NEXT_ROUND};
    }
}
