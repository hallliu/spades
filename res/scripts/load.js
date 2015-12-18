require.config({
    "baseUrl": "scripts/",
    paths: {
        "jquery": "lib/jquery.min",
        "velocity": "lib/velocity.min",
        "underscore": "lib/underscore",
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

require(["main"]);
