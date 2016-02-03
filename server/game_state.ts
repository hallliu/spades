import Immutable = require("immutable");
import _ = require("underscore");

class HandState {
    private _cards: Immutable.Map<number, Immutable.Set<number>>;
    private _cards_in_play: Immutable.Map<number, number>; 
    private _bids: Immutable.Map<number, number>;
    private _tricks: Immutable.Map<number, number>;
    private _next_player: number;

    constructor(next_player?: number) {
        if (!next_player) {
            next_player = _.random(4);
        }
        var all_cards: number[] = _.range(52);
        _.shuffle(all_cards);
        this._cards.withMutations(cards => {
            for (var i: number = 0; i < 4; i++) {
                cards.set(i, Immutable.Set(all_cards.slice(i * 13, (i + 1) * 13)));
            }
        });
    }
}
