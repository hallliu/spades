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
    },
});

require(["base/main"]);
