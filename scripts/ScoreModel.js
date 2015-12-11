"use strict";

define(["./Constants", "underscore"], function(Constants, _) {
    var obtain = function() {
        var score_model_singleton;

        var ScoreModel = function() {
            this.listeners = [];

            this.score_rows = {};
            this.score_rows.team_1 = [];
            this.score_rows.team_2 = [];

            this.cumulative_scores = {};
            this.cumulative_scores.team_1 = 0;
            this.cumulative_scores.team_2 = 0;
        };

        ScoreModel.prototype.start_new_round = function() {
            var construct_new_row = function(curr_score) {
                return {
                    bids: {},
                    round_score: null,
                    cumulative_score: curr_score,
                };
            };

            var score_row_1 = construct_new_row(this.cumulative_scores.team_1);
            var score_row_2 = construct_new_row(this.cumulative_scores.team_2);

            this.score_rows.team_1.push(score_row_1);
            this.score_rows.team_2.push(score_row_2);

            this.update_listeners(function(l) {l.on_score_row_added();});
        };

        /**
         * team: either team_1 or team_2
         * player: either player_1 or player_2
         */
        ScoreModel.prototype.add_bid = function(team, player, bid_val) {
            var team_score_rows = this.score_rows[team];
            var current_score_row = team_score_rows[team_score_rows.length - 1];
            current_score_row.bids[player] = bid_val;
            
            this.update_listeners(function(l) {l.on_scores_updated(team);});
        };

        ScoreModel.prototype.set_score = function(team, score) {
            var team_score_rows = this.score_rows[team];
            var current_score_row = team_score_rows[team_score_rows.length - 1];
            var last_score_row = team_score_rows[team_score_rows.length - 2];
            current_score_row.round_score = score;
            this.cumulative_scores[team] += score;
            current_score_row.cumulative_score = this.cumulative_scores[team];

            this.update_listeners(function(l) {l.on_scores_updated(team);});
        };

        ScoreModel.prototype.update_listeners = function(listener_fn) {
            this.listeners.forEach(function(listener) {
                listener_fn(listener);
            });
        };

        ScoreModel.prototype.add_listener = function(listener) {
            this.listeners.push(listener);
        };

        var obtain = function() {
            score_model_singleton = score_model_singleton || new ScoreModel();
            return score_model_singleton;
        };

        return obtain;
    }();

    return {obtain: obtain};
});
