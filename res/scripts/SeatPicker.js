"use strict";

define(["Constants", "underscore", "jquery", /* noarg */ "jquery.ui"],
       function(Constants, _, $) {
   var obtain = function() {
       var instance;

       var SeatPicker = function() {
           this.el = $("#seat-picker");
           this.el.dialog({
               autoOpen: false,
               modal: true,
               minHeight: 260,
               minWidth: 400,
               title: "Pick your seat.",
           });
       };

       /**
        * @param seat_names: object maps seat positions to player names
        * @param action: function action to be executed when a seat is chosen. Takes
        *                         the position as an argument.
        */
       SeatPicker.prototype.show = function(seat_names, action) {
           _.each([0, 1, 2, 3], function(i) {
               var el = $("#seat-" + i + "-picker");
               el.button();
               if (_.has(seat_names, i)) {
                   el.html(seat_names[i]);
                   el.button("disable");
               } else {
                   el.html("Sit here");
                   el.button("enable");
                   el.click(_.bind(function() {
                       //TODO: don't close until server confirms choice.
                       this.el.dialog("close");
                       action(i);
                   }, this));
               }
           }, this);
           this.el.dialog("open");
       };


       return function() {
           instance = instance || new SeatPicker();
           return instance;
       };
   }(); 

   return {obtain: obtain};
});
