// <reference path="node_modules/immutable/dist/immutable.d.ts" />
import Immutable = require("immutable");

interface RoomInfoMembers {
    speculative_players?: Immutable.Map<string, NodeJS.Timer>;
    players?: Immutable.Map<number, string>;
    teams?: Immutable.Map<number, string>;
}
    
class RoomInfo {
    private _speculative_players: Immutable.Map<string, NodeJS.Timer>;
    private _players: Immutable.Map<number, string>;
    private _teams: Immutable.Map<number, string>;

    id: string;
    last_active: number;

    constructor(id?: string) {
        if (id) {
            this.id = id;
            this._speculative_players = Immutable.Map<string, NodeJS.Timer>();
            this._players = Immutable.Map<number, string>();
            this._teams = Immutable.Map<number, string>();
        }
        this.last_active = new Date().getTime();
    }
    
    get speculative_players(): Immutable.Map<string, NodeJS.Timer> {
        return this._speculative_players;
    }

    get teams(): Immutable.Map<number, string> {
        return this._teams;
    }

    get players(): Immutable.Map<number, string> {
        return this._players;
    }

    add_player(position: number, player_id: string): RoomInfo {
        var new_players = this._players.set(position, player_id);
        return new RoomInfo().copy(this, {players: new_players});
    }

    add_new_speculative_player(player_uuid: string, timer: NodeJS.Timer): RoomInfo {
        var new_speculative_players = this._speculative_players.set(player_uuid, timer);
        return new RoomInfo().copy(this, {speculative_players: new_speculative_players});
    }

    clear_speculative_timeout(player_uuid: string): RoomInfo {
        if (this._speculative_players.has(player_uuid)) {
            clearTimeout(this._speculative_players.get(player_uuid));
            var new_speculative_players = this._speculative_players.delete(player_uuid);
            return new RoomInfo().copy(this, {speculative_players: new_speculative_players});
        } else {
            return this;
        }
    }

    copy(other: RoomInfo, modifications: RoomInfoMembers = {}): RoomInfo {
        this.id = other.id;
        this._speculative_players = modifications.speculative_players || other.speculative_players;
        this._players = modifications.players || other.players;
        this._teams = modifications.teams || other.teams;
        return this;
    }

    is_full(): boolean {
        return this._players.size + this._speculative_players.size >= 4;
    }
}

export = RoomInfo;
