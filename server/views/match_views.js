// Match views -- rendering a normal match
//

var
  assert           = require('assert'),
  ears             = require('../ears'),
  hist             = require('../history'),
  switchboard      = require('./switchboard'),
  renderJson       = require('./view_helpers').renderJson,
  makeJsonRenderer = require('./view_helpers').makeJsonRenderer,
  buildUuid        = require('./view_helpers').buildUuid;

// here's the python code for all these callbacks. we'll need ears for all these.
//   def on_pump(field):
//       self.history.add({"field": field})
//   def on_hit(obj, location):
//       self.history.add({"hit": {'obj': obj, 'location': location}})
//   def on_splash(obj, location, damage):
//       self.history.add({"splash_damage":
//           {"objects": obj, "location": location, "damage": damage}})
// there's also one for on_new_slot
//   def on_remove_slot():
//       self.history.add({"remove_slot": True})
//   def on_disconnect_robot(robot):
//       self.history.add({"disconnect_robot": robot})
//   def on_new_robot(robot):
//       self.history.add({"connected_robot": robot})

ears.listenFor({
  'MatchList': {
    'newMatch': function(mlist, match) {
      // Just minding my own business...
      match.history = new hist.History();
    }
  },
  'Match': {
    'newSlot': function(match) {
      match.history.add({'new_slot': true});
    },
    'removeSlot': function(match) {
      match.history.add({'remove_slot': true});
    }
  },
  'GameLogic': {
    'connectedRobot': function(game, robot) {
      game.match.history.add({'connected_robot': robot});
    }
  }
});

function dispatchMatchViews(req, res, match, path) {
  // matchListtViews is always nice enough to guarantee that match exists
  // and is a valid match.

  //renderJson(req, res, match);
  switchboard.dispatchQueryOverload(req, res,
    ['register'],
    function(req, res) {
      var rid = match.requestSlot(buildUuid(15));
      require('../log').debug(rid);
      renderJson(req, res, rid);
    },

    ['info'],
    makeJsonRenderer(match),

    ['connect'],
    function(req, res) {

    }

  );

}

process.mixin(exports,
  {
    dispatchMatchViews: dispatchMatchViews
  }
);
