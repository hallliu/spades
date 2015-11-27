require.config({
    "baseUrl": "scripts/lib",
    paths: {
        "jquery": "jquery.min",
        "velocity": "velocity.min",
        "underscore": "underscore",
        "base": "../",
    },
    shim: {
        "velocity": {
            deps: ["jquery"],
        },
        "underscore": {
            exports: ["_"],
        },
    },
});

require(["base/main"]);
