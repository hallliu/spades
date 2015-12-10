"use strict";

define(["Constants", "underscore", "ScoreModel"], function(Constants, _, ScoreModel) {
    var obtain = function () {
        var scoring_area_singleton;
        /**
         * @constructor
         */
        var ScoringArea = function() {
            this.el = $("#scoring-area");
            this.score_template = _.template($("#score_row_template").html());
            this.el.css("left",
                    $("#main-container").position().left + $("#main-container").width());
            this.score_model = new ScoreModel.ScoreModel();
            this.score_model.add_listener(this);

            this.team_name_to_model_name = {};
            this.player_name_to_model_name = {};
        };

        /**
         * name_dict is a dict of the form: 
         * {team_name_1: [player_1, player_2],
         *  team_name_2: [player_3, player_4]}
         */
        ScoringArea.prototype.update_names = function(team_name_to_players) {
            // TODO: add checks for dup names
            
            this.team_name_to_players = team_name_to_players;

            var player_to_team = _.reduce(name_dict, function(d, vs, k) {
                vs.forEach(function(v) {
                    d[v] = k;
                });
                return d;
            }, {}); // in python, {v: k for v in vs for k, vs in name_dict.items()}

            this.team_name_to_model_name = _.chain(team_name_to_players)
                    .keys()
                    .map(function(team_name, idx) {
                        return [team_name, "team_" + (idx + 1)];
                    })
                    .object().value();
            this.player_name_to_model_name = _.chain(team_name_to_players)
                    .values()
                    .map(function(players) {
                        return _.object(_.map(players, function(player, idx) {
                            return [player, "player_" + (idx + 1)];
                        }));
                    })
                    .reduce(function(d, v) {return _.extend(d, v)}, {})
                    .value();

            this.on_names_changed();
        };
        
        var obtain = function() {
            scoring_area_singleton = scoring_area_singleton || new ScoringArea();
            return scoring_area_singleton;
        };
        
        return obtain;
    }();

    return {obtain: obtain};
});
