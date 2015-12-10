"use strict";

define(["./Constants", "underscore"], function(Constants, _) {
    var ScoreModel = function() {
        var ScoreModel = function(team_name_1, team_name_2) {
            this.team_name_1 = team_name_1;
            this.team_name_2 = team_name_2;

            this.listeners = [];

            this.score_rows = {};
            this.score_rows[team_name_1] = [];
            this.score_rows[team_name_2] = [];

            this.cumulative_scores = {};
            this.cumulative_scores[team_name_1] = 0;
            this.cumulative_scores[team_name_2] = 0;

            this.start_new_round();
        };

        ScoreModel.prototype.start_new_round = function() {
            var construct_new_row = function(curr_score) {
                return {
                    bids: {},
                    round_score: null,
                    cumulative_score: curr_score,
                };
            };

            var score_row_1 = construct_new_row(this.cumulative_scores[this.team_name_1]);
            var score_row_2 = construct_new_row(this.cumulative_scores[this.team_name_2]);

            this.score_rows[this.team_name_1].push(score_row_1);
            this.score_rows[this.team_name_2].push(score_row_2);

            this.update_listeners(function(l) {l.on_score_row_added();});
        };

        ScoreModel.prototype.add_bid = function(team_name, player_id, bid_val) {
            var team_score_rows = this.score_rows[team_name];
            var current_score_row = team_score_rows[team_score_rows.length - 1];
            current_score_row.bids[player_id] = bid_val;
            
            this.update_listeners(function() {l.on_bid_added(team_name, player_id);});
        };

        ScoreModel.prototype.set_score = function(team_name, score) {
            var team_score_rows = this.score_rows[team_name];
            var current_score_row = team_score_rows[team_score_rows.length - 1];
            var last_score_row = team_score_rows[team_score_rows.length - 2];
            current_score_row.round_score = score;
            current_score_row.cumulative_score = last_score_row.cumulative_score + score;

            this.update_listeners(function() {l.on_scores_updated(team_name);});
        };

        ScoreModel.prototype.update_listeners = function(listener_fn) {
            this.listeners.forEach(function(listener) {
                listener_fn(listener);
            });
        };

        return ScoreModel;
    }();

    return {ScoreModel: ScoreModel};
});
