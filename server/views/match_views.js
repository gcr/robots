// Match views -- rendering a normal match
//

var
  assert              = require('assert'),
  url                 = require('url'),
  ears                = require('../ears'),
  hist                = require('../history'),
  log                 = require('../log'),
  switchboard         = require('./switchboard'),
  frame               = require('./frames'),
  robotViews          = require('./robot_views'),
  renderJson          = require('./view_helpers').renderJson,
  renderError         = require('./view_helpers').renderError,
  makeHistoryRenderer = require('./view_helpers').makeHistoryRenderer,
  makeJsonRenderer    = require('./view_helpers').makeJsonRenderer,
  buildUuid           = require('./view_helpers').buildUuid,
  staticFiles         = require('./static');

ears.listenFor({
  'MatchList': {
    'newMatch': function(mlist, match) {
      // Just minding my own business...
      match.history = new hist.History();
      match.frames = new frame.FrameList(match);
    }
  },
  'Match': {
    'newSlot': function(match) {
      match.history.add({'new_slot': true});
    },
    'removeSlot': function(match) {
      match.history.add({'remove_slot': true});
    },
    'started': function(match) {
      match.history.add({'match_started': true});
    }
  },
  'Field': {
    'pump': function(field) {
      var f = field.game.match.frame.newFrame();
      field.game.match.history.add({"frame": f});
    }
  },
  'Robot': {
    'damaged': function(robot, damage) {
      robot.field.game.match.frame.registerEvent({'robot_damaged': robot.toJSON(), 'new_armor': robot.armor});
    }
  },
  'GameLogic': {
    'connectedRobot': function(game, robotId, robot) {
      game.match.history.add({'connected_robot': robot.toJSON()});
    },
    'disconnectedRobot': function(game, robot) {
      game.match.history.add({'disconnect_robot': robot.toJSON()});
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
    // http://localhost:8080/matches/mid/robot_id -- this means we must
    // dispatch to a robot.
    function(req, res, robotId) {
      assert.ok(robotId in match.game.robots, "This robot doesn't exist!");
      var robot = match.game.robots[robotId];
      return robotViews.dispatchRobotViews(req, res, robot, robotId, match);
    },

    // They just want the match.
    // http://localhost:8080/matches/mid
    function(req, res) {
      return switchboard.dispatchQueryOverload(req, res,
        ['register'],
        function(req, res) {
          var rid = match.requestSlot(buildUuid(15));
          renderJson(req, res, rid);
        },

        ['info'],
        function(req, res) {
          // Render information on the match
          return renderJson(req, res, process.mixin(match.toJSON(),
            {
              history: match.history.time()
            }
          ));
        },

        ['start', 'auth_code'],
        function(req, res, ignoreme, authCode) {
          // Starts the match. (ignoreme is passed the value of 'start', which
          // will likely be 't' or '1' or something.)
          assert.ok(!match.game.started, "You cannot start a started match!");
          renderJson(req, res, match.start(authCode));
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
