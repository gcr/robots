// Match views -- rendering a normal match
//

var
  assert              = require('assert'),
  url                 = require('url'),
  ears                = require('../ears'),
  hist                = require('../history'),
  log                 = require('../log'),
  switchboard         = require('./switchboard'),
  pickCoolName        = require('./robot_naming').pickCoolName,
  renderJson          = require('./view_helpers').renderJson,
  renderError         = require('./view_helpers').renderError,
  makeHistoryRenderer = require('./view_helpers').makeHistoryRenderer,
  makeJsonRenderer    = require('./view_helpers').makeJsonRenderer,
  buildUuid           = require('./view_helpers').buildUuid,
  staticFiles         = require('./static');

// here's the python code for all these callbacks. we'll need ears for all these.
//   def on_pump(field):
//       self.history.add({"field": field})
//   def on_hit(obj, location):
//       self.history.add({"hit": {'obj': obj, 'location': location}})
//   def on_splash(obj, location, damage):
//       self.history.add({"splash_damage":
//           {"objects": obj, "location": location, "damage": damage}})

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
  'Field': {
    'pump': function(field) {
      field.game.match.history.add({"field": field.toJson()});
    }
  },
  'GameLogic': {
    'connectedRobot': function(game, robot) {
      game.match.history.add({'connected_robot': robot});
    },
    'disconnectedRobot': function(game, robot) {
      game.match.history.add({'disconnect_robot': robot});
    }
  }
});

function dispatchMatchViews(req, res, match, path) {
  // match_list_views.js is always nice enough to guarantee that match exists
  // and is a valid match.
  //
  // so. two possibilities. one: they wanted the robot in the match. two: they
  // just wanted the match. we'll handle the former first.
  return switchboard.dispatchOnePath(req, res, path,
    // http://localhost:8080/matches/mid/robot_id
    function(req, res, robotId) {
      assert.ok(robotId in match.game.robots, "This robot doesn't exist!");
      var robot = match.game.robots[robotId];
      return switchboard.dispatchQueryOverload(req, res,
        // http://localhost:8080/matches/mid/robot_id?connect=t
        ['connect'],
        function(req, res) {
          var query = url.parse(req.url, true).query || {};

          match.game.setFuture(0, robotId, function(err, time) {
            // What happens when the match starts?
            // Render the robot. BUT don't render just 'var robot'; maybe it
            // changed.
            if (err) {
              // This part will get run whenever we get duplicate connections.
              match.game.disconnectRobot(robotId);
              return renderError(req, res, err);
            }
            return renderJson(req, res, match.game.robots[robotId]);
          });

          log.info("Match: " + match.mid + " robot: " + robotId + " connected");

          var robot = match.game.makeRobot(robotId, query.name || pickCoolName());

          req.connection.setTimeout(300000); // 5min
          req.connection.addListener("end", function() {
            // sometimes if the kind fellow on the other end exits his client,
            // he doesn't actually *close* the connection.
            req.connection.close();
          });
          req.connection.addListener("close", function() {
            // Remove the robot, but only if the match didn't start.
            if (!match.game.started && match.game.robots[robotId] === robot) {
              log.warn("Lost connection with match: " + match.mid + " robot: " + robotId);
              match.game.disconnectRobot(robotId);
            }
          });
        }
      );
    },

    // they just want the match.
    // http://localhost:8080/matches/mid
    function(req, res) {
      return switchboard.dispatchQueryOverload(req, res,
        ['register'],
        function(req, res) {
          var rid = match.requestSlot(buildUuid(15));
          require('../log').debug(rid);
          renderJson(req, res, rid);
        },

        ['info'],
        function(req, res) {
          // Render information on the match
          return renderJson(req, res, process.mixin(match.toJson(),
            {
              history: match.history.time()
            }
          ));
        },

        ['history'],
        makeHistoryRenderer(match.history),

        [],
        staticFiles.makeFileServer("server/static/match.htm")
      );
    }
  );
}

process.mixin(exports,
  {
    dispatchMatchViews: dispatchMatchViews
  }
);
