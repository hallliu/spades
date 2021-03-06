"use strict";
/**
 * This file is used only to position the major UI elements on page load.
 * Currently handles the main play container, the play area, the scoring area,
 * and the chat area.
 */

define(["Constants", "underscore"], function(Constants, _) {
    /**
     * @param elem -- A jquery element
     * @param dims -- an object with height, width, left, and top properties
     */
    var set_dims = function(elem, dims) {
        if (dims.top) elem.css('top', dims.top + 'px');
        if (dims.left) elem.css('left', dims.left + 'px');
        if (dims.width) elem.width(dims.width);
        if (dims.height) elem.height(dims.height);
    };

    var fix_scoring_ui = function() {
        // May Satan bless this kludgey fix
        var left_width = 0;
        var right_width = 0;
        _.each($(".score-details").children().slice(0, 4), function(x) {
            left_width += $(x).width();
        });
        _.each($(".score-details").children().slice(4, 8), function(x) {
            right_width += $(x).width();
        });
        $(".team-0-name").width(left_width + 8);
        $(".team-1-name").width(right_width + 8);
    };

    var set_positions = function() {
        set_dims($("#main-container"), Constants.MAIN_BOARD_DIMS);
        set_dims($("#play-area"), _.extend({
            left: (Constants.MAIN_BOARD_DIMS.width - Constants.PLAY_AREA_DIMS.width) / 2,
            top: (Constants.MAIN_BOARD_DIMS.height - Constants.PLAY_AREA_DIMS.height) / 2,
        }, Constants.PLAY_AREA_DIMS));

        set_dims($("#right-panel"), _.extend({
            left: Constants.MAIN_BOARD_DIMS.width + Constants.MAIN_BOARD_DIMS.left + 8,
            top: Constants.MAIN_BOARD_DIMS.top,
            height: Constants.MAIN_BOARD_DIMS.height - 2 * Constants.RIGHT_PANEL_DIMS.border_size,
        }, Constants.RIGHT_PANEL_DIMS));

        set_dims($("#chat-area"), Constants.CHAT_AREA_DIMS);

        set_dims($("tbody"), {
            height: $("#scoring-area").height() - $("#scoring-area thead").height()
        });

        fix_scoring_ui();
    }

    return {
        set_positions: set_positions,
        fix_scoring_ui: fix_scoring_ui,
    };
});
