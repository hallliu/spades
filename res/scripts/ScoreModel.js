"use strict";

define(["./Constants", "underscore"], function(Constants, _) {
    var obtain = function() {
        var score_model_singleton;

        var ScoreModel = function() {
            this.listeners = [];

            this.score_rows = [];

            this.cumulative_scores = {};
            this.cumulative_scores.team_0 = 0;
            this.cumulative_scores.team_1 = 0;
        };

        ScoreModel.prototype.start_new_round = function() {
            var new_score_row = {
                bid_0: "",
                bid_1: "",
                bid_2: "",
                bid_3: "",
                round_score_0: "",
                round_score_1: "",
                cumulative_score_0: this.cumulative_scores.team_0,
                cumulative_score_1: this.cumulative_scores.team_1,
            };

            this.score_rows.push(new_score_row);

            this.update_listeners(function(l) {l.on_score_row_added();});
        };

        /**
         * player: 0, 1, 2, or 3
         */
        ScoreModel.prototype.add_bid = function(player, bid_val) {
            var current_score_row = _.last(this.score_rows);
            current_score_row["bid_" + player] = bid_val;
            
            this.update_listeners(function(l) {l.on_scores_updated();});
        };

        /**
         * team: 0 or 1
         */
        ScoreModel.prototype.set_score = function(team, score) {
            var current_score_row = _.last(this.score_rows);

            current_score_row["round_score_" + team] = score;
            this.cumulative_scores["team_" + team] += score;

            current_score_row["cumulative_score_" + team] = this.cumulative_scores["team_" + team];

            this.update_listeners(function(l) {l.on_scores_updated();});
        };

        ScoreModel.prototype.clear_scores = function() {
            this.cumulative_scores = {
                team_0: 0,
                team_1: 0,
            };
            this.score_rows = [];
            this.update_listeners(function(l) {l.on_scores_cleared();});
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
