"use strict";

define(["Constants", "underscore", "ScoreModel"], function(Constants, _, ScoreModel) {
    var obtain = function () {
        var scoring_area_singleton;
        /**
         * @constructor
         */
        var ScoringArea = function() {
            this.el = $("#scoring-area");
            this.team_areas = {
                team_1: $("#team-1-area"),
                team_2: $("#team-2-area"),
            };

            this.score_template = _.template($("#score_row_template").html());
            this.score_model = ScoreModel.obtain();
            this.score_model.add_listener(this);
        };

        /**
         * name_dict is a dict of the form: 
         * {team_1: {
         *      name: <team's name>
         *      player_1: <team 1 player 1 name>
         *      player_2: <team 1 player 2 name>
         *  },
         *  team_2: {
         *      name: <team's name>
         *      player_1: <team 2 player 1 name>
         *      player_2: <team 2 player 2 name>
         *  }}
         */
        ScoringArea.prototype.update_names = function(team_name_dict) {
            _.each(team_name_dict, function(name_info, team_id) {
                var team_area = this.team_areas[team_id];
                team_area.find(".team-name").html(name_info.name);
                team_area.find(".player-1").html(name_info.player_1);
                team_area.find(".player-2").html(name_info.player_2);
            }, this);
        };

        ScoringArea.prototype.on_score_row_added = function() {
            _.each(this.team_areas, function(team_area, team_id) {
                var new_score_row = $("<tr></tr>");
                new_score_row.addClass("scoring-row");
                team_area.find("tbody").append(new_score_row);
                this.on_scores_updated(team_id);
            }, this);
        };
        
        ScoringArea.prototype.on_scores_updated = function(team_id) {
            var latest_score_elem = this.team_areas[team_id].find("tbody tr:last");
            var latest_score_row = _.last(this.score_model.score_rows[team_id]);
            latest_score_elem.html(this.score_template({
                bid_1: latest_score_row.bids.player_1,
                bid_2: latest_score_row.bids.player_2,
                round_score: latest_score_row.round_score,
                cumulative_score: latest_score_row.cumulative_score,
            }));
        };

        var obtain = function() {
            scoring_area_singleton = scoring_area_singleton || new ScoringArea();
            return scoring_area_singleton;
        };
        
        return obtain;
    }();

    return {obtain: obtain};
});
