"use strict";

define(["Constants", "underscore", "ScoreModel", "UIPosition"],
       function(Constants, _, ScoreModel, UIPosition) {
    var obtain = function () {
        var scoring_area_singleton;
        /**
         * @constructor
         */
        var ScoringArea = function() {
            this.el = $("#scoring-area");

            this.score_template = _.template($("#score_row_template").html());
            this.score_model = ScoreModel.obtain();
            this.score_model.add_listener(this);
        };

        /**
         * name_dict is a dict of the form: 
         * 
         * { 
         *     player_names: {
         *         0: <name 0>,
         *         ...
         *     },
         *     team_names: {
         *         0: <name 0>,
         *         ...
         *     }
         * }
         */
        ScoringArea.prototype.update_names = function(name_dict) {
            var set_team_if_present = _.bind(function(team_idx) {
                if (_.has(name_dict, "team_names") && _.has(name_dict.team_names, team_idx)) {
                    this.el.find(".team-" + team_idx + "-name").html(name_dict.team_names[team_idx]);
                }
            }, this);

            var set_player_if_present = _.bind(function(player_idx) {
                if (_.has(name_dict, "player_names") && _.has(name_dict.player_names, player_idx)) {
                    this.el.find(".player-" + player_idx).html(name_dict.player_names[player_idx]);
                }
            }, this);

            _.each([0, 1], function(i) {
                set_team_if_present(i);
            });

            _.each([0, 1, 2, 3], function(i) {
                set_player_if_present(i);
            });

            UIPosition.fix_scoring_ui();
        };

        ScoringArea.prototype.on_score_row_added = function() {
            var new_score_row = $("<tr></tr>");
            new_score_row.addClass("scoring-row");
            this.el.find("tbody").append(new_score_row);
            this.on_scores_updated();
        };
        
        ScoringArea.prototype.on_scores_updated = function() {
            var latest_score_elem = this.el.find("tbody tr:last");
            var latest_score_row = _.last(this.score_model.score_rows);
            latest_score_elem.html(this.score_template(latest_score_row));
        };

        ScoringArea.prototype.on_scores_cleared = function() {
            this.el.find("tbody").empty();
        };

        var obtain = function() {
            scoring_area_singleton = scoring_area_singleton || new ScoringArea();
            return scoring_area_singleton;
        };
        
        return obtain;
    }();

    return {obtain: obtain};
});
