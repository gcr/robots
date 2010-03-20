// robot_views.js
// --------------
// This file handles connections with the robot. We're the guys who forward
// various actions to the game logic when you ask your robot to turn or
// whatever.

var
  url          = require('url'),
  switchboard  = require('./switchboard'),
  log          = require('../log'),
  pickCoolName = require('./robot_naming').pickCoolName,
  renderJson   = require('./view_helpers').renderJson,
  renderError  = require('./view_helpers').renderError;

// No ears here.

function dispatchRobotViews(req, res, robot, robotId, match) {
  // This function handles rendering what happens to the robots.
  var query = url.parse(req.url, true).query || {};
  return switchboard.dispatchQueryOverload(req, res,
    // http://localhost:8080/matches/mid/robot_id?connect=t
    ['connect'],
    function(req, res) {
      match.game.setFuture(0, robotId,
        function(err, time) {
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

      var robot = match.game.makeRobot(robotId, query.name || pickCoolName());

      req.connection.setTimeout(300000); // 5min
      req.connection.addListener("end", function() {
        // Sometimes if the kind fellow on the other end exits his client,
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
}

process.mixin(exports,
  { 
    dispatchRobotViews: dispatchRobotViews
  }
);
