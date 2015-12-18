require.config({
    "baseUrl": "scripts/",
    paths: {
        "jquery": "lib/jquery.min",
        "velocity": "lib/velocity.min",
        "underscore": "lib/underscore",
        "socketio": "../socket.io/socket.io",
    },
    shim: {
        "velocity": {
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
