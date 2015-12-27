"use strict";

define(["Constants", "underscore"], function(Constants, _) {
    var obtain = function() {
        var instance;

        var ChatArea = function() {
            this.el = $("#chat-area");
            this.text_entry_el = this.el.find("#chat-text-entry");
            this.chat_display_el = this.el.find("#chat-display-box");
            this.listeners = [];

            this.text_entry_el.keypress(_.bind(function(e) {
                if (e.which === 13) {
                    this.handle_text_entry();
                    this.text_entry_el.val("");
                    e.stopPropagation();
                }
            }, this));
        };

        ChatArea.prototype.handle_text_entry = function() {
            var entered_text = this.text_entry_el.val();
            _.each(this.listeners, function(l) {
                l.on_text_entered(entered_text);
            });
        };

        ChatArea.prototype.push_chat_message = function(text) {
            var text_el = $("<p></p>");
            text_el.html(text);
            this.chat_display_el.append(text_el);
            text_el.velocity("scroll", {container: this.chat_display_el,
                             duration: 400,
                             easing: "spring",
            });
        };

        ChatArea.prototype.push_info_message = function(text, color) {
            color = color || "#909090";
            var text_el = $("<p></p>");
            text_el.html(text);
            text_el.css("color", color);
            this.chat_display_el.append(text_el);
            text_el.velocity("scroll", {container: this.chat_display_el,
                             duration: 400,
                             easing: "spring",
            });
        };

        ChatArea.prototype.add_listener = function(l) {
            this.listeners.push(l);
        };

        var obtain = function() {
            instance = instance || new ChatArea();
            return instance;
        };

        return obtain;
    }();

    return {obtain: obtain};
});
