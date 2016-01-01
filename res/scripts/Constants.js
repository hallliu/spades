define({
    MAIN_BOARD_DIMS: {
        height: 750,
        width: 1000,
        top: 0,
        left: 0,
    },

    PLAY_AREA_DIMS: {
        width: 282,
        height: 417,
    },

    RIGHT_PANEL_DIMS: {
        width: 365,
        border_size: 2,
    },

    CHAT_AREA_DIMS: {
        width: 412,
    },

    CARD_HEIGHT: 135,
    CARD_WIDTH: 90,
    CARD_OFFSET: 20, // The offset when the cards are in the deck
    STARTING_Z: 0, // The z-index for the leftmost card in a deck
    CARD_NAMES: ["two", "three", "four", "five", "six", "seven", "eight",
            "nine", "ten", "jack", "queen", "king", "ace"],
    SUIT_NAMES: ["spades", "hearts", "clubs", "diamonds"],
    CARD_PEEK_SPEED: 200,
    CARD_PLAY_SPEED: 300,
    DECK_BORDER_THICKNESS: 2,
    DECK_DIST_FROM_BOARD_EDGE: 10,
});
