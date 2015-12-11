"use strict";

define(["./CardUI", "./PlayArea", "velocity", "underscore", "ScoringArea", "ScoreModel"],
        function(CardUI, PlayArea, Velocity, _, ScoringArea, ScoreModel) {
    var all_cards = _.range(52);
    all_cards = _.shuffle(all_cards);
    var positions = ["bottom", "top", "left", "right"];
    var decks = _.map(_.range(4), function(i) {
        var card_coll = _.map(_.range(i*13, (i+1)*13), function(j) {
            return new CardUI.Card(all_cards[j]);
        });
        return new CardUI.Deck(card_coll, positions[i], true);
    });

    var play_area = PlayArea.obtain();
    play_area.set_suit("hearts");

    var scoring_area = ScoringArea.obtain();
    var score_model = ScoreModel.obtain();

    decks.forEach(function(d) {d.attach()});
    window.decks = decks;
    window.play_area = play_area;
    window.scoring_area = scoring_area;
    window.score_model = score_model;
    window.team_name_info = {team_1: {
  name: "Team 1",
  player_1: "playerA",
  player_2: "playerB",
},
                      team_2: {
                        name: "Team 2",
                        player_1: "playerC",
                        player_2: "playerD",
                      }
                     }
});
