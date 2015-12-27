require.config({
    "baseUrl": "scripts/",
    paths: {
        "jquery": "lib/jquery.min",
        "velocity": "lib/velocity.min",
        "underscore": "lib/underscore",
        "socketio": "../socket.io/socket.io",
        "jquery.ui": "lib/jquery-ui.min",
    },
    shim: {
        "velocity": {
            deps: ["jquery"],
        },
        "jquery.ui": {
            deps: ["jquery"],
        },
        "underscore": {
            exports: ["_"],
        },
        "socketio": {
            exports: ["io"],
        },
    },
});

require(["main"]);
