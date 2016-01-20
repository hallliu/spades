"use strict";

define(["Constants", "underscore"],
       function(Constants, _) {

var obtain = function() {
    var obj;

    var make_trick_div = function() {
        return $("<div></div>").addClass("trick-marker");
    };

    var PlayerInfoManager = function() {
        this.player_to_info_el = {};
    };

    PlayerInfoManager.prototype.register_info_area = function(position, el) {
        this.player_to_info_el[Constants.POSITION_TO_ID[position]] = el;
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
    PlayerInfoManager.prototype.update_names = function(name_dict) {
        _.each(this.player_to_info_el, function(el, id) {
            el.find(".player-name").html(name_dict.player_names[id]);
        });
    };

    PlayerInfoManager.prototype.set_num_tricks = function(id, num_tricks) {
        var trick_area = this.player_to_info_el[id].find(".tricks-taken-area");
        trick_area.empty();
        _.times(num_tricks, function() {
            trick_area.append(make_trick_div());
        });
    };

    var obtain = function() {
        obj = obj || new PlayerInfoManager();
        return obj;
    };

    return obtain;
}();

return {obtain: obtain};
}
