"use strict";

define(["./Constants", "underscore"], function(Constants, _) {
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
        };
        
        var obtain = function() {
            scoring_area_singleton = scoring_area_singleton || new ScoringArea();
            return scoring_area_singleton;
        };
        
        return obtain;
    }();

    return {obtain: obtain};
});
