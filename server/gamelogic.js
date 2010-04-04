// gamelogic.js -- implements game logic.
//

var
  sys    = require('sys'),
  assert = require('assert'),
  robot  = require('./physics/robot'),
  roboproto = robot.Robot.prototype,
  field  = require('./physics/field'),
  events = require('events');

function GameLogic(match) {
  this.match = match;

  this.field = new field.Field(this, 1024, 1024);

  // A mapping.
  //     this.futures = {
  //       time: { {callback: [Function], errback: [Function]},
  //               {callback: [Function], errback: [Function]}
  //             },
  //       time: { {callback: [Function], errback: [Function]},
  //             },
  //     }
  this.futures = {};
  this.time = 0;

  this.started = false;

  // A mapping.
  // this.robots = { robot_id: Robot, robot_id: Robot, ... }
  this.robots = {};

}
sys.inherits(GameLogic, events.EventEmitter);

GameLogic.prototype.robotArray = function() {
  // an array of all the robots in this.robots. Note that we should call
  // toJSON on these to make this immutable.
  var result = [];
  for (var robId in this.robots) {
    if (this.robots.hasOwnProperty(robId)) {
      result.push(this.robots[robId] === null? null : this.robots[robId].toJSON());
    }
  }
  return result;
};

GameLogic.prototype.toJSON = function() {
  return {
    field_size: [this.field.width, this.field.height],
    started: this.started,
    robots: this.robotArray(),
    gametime: this.time
  };
};

GameLogic.prototype.start = function() {
  // Start the match!
  //
  this.started = true;
  this.emit("started", this);
  // Then, run all the queued actions right at the beginning.
  this.pump();
};

GameLogic.prototype.pump = function() {
  // First. go through and carry out all these wonderful callbacks.
  for (var rid in this.futures[this.time]) {
    if (this.futures[this.time].hasOwnProperty(rid)) {
      try {
        this.futures[this.time][rid].callback(this.time);
      } catch(err) {
        this.futures[this.time][rid].errback(err);
      }
    }
  }
  delete this.futures[this.time];
  this.field.pump();
  this.emit("pump", this, this.time);
  this.time += 1;
};

GameLogic.prototype.setFuture = function(time, robotId, cb, errback) {
  // Rigs callback (cb) to be executed at time (time). The callback should
  // (should!) expect two arguments: a possible error, and the actual results
  // of the callback. By convention, of course; GameLogic.prototype.pump won't
  // care.
  assert.ok(time >= this.time, "That already happened!");

  // But first, we should go through our futures and ensure that no other
  // actions are pending for this robot.
  for (var ftime in this.futures) {
    if (this.futures.hasOwnProperty(ftime)) {
      if (robotId in this.futures[ftime]) {
        // Cancel that! First argument is a callback.
        this.futures[ftime][robotId].errback("Tried to do two things at once!");
      }
    }
  }
  this.futures[time] = this.futures[time] || {};
  this.futures[time][robotId] = {callback: cb, errback: errback};
};

GameLogic.prototype.robotAction = function(robotId, action, args, callback, errback) {
    // This function will make a robot do some kind of action later. E.g. need
    // to turn? robotACtion(rid, 'turn', 25) will do what you want.
    var game = this,
        robot = this.robots[robotId];

    assert.ok(robot, "This robot doesn't exist!");
    // list of functions we still need:

    // Now, actually take the actions.
    var time, method, laterFunc;
    if (action in this.INSTANT) {
      try {
        return callback(this.INSTANT[action].apply(robot, args));
      } catch (err) {
        return errback(err);
      }
    } else if (action in this.DELAYED) {
      time = this.DELAYED[action][0];
      method = this.DELAYED[action][1];
      this.setFuture(this.time +  time, robotId,
        function() {
          callback(method.apply(robot, args));
        },
        errback);
    } else if (action in this.PARTIAL_DELAYED) {
      time = this.PARTIAL_DELAYED[action][0];
      method = this.PARTIAL_DELAYED[action][1];
      // Don't lose your head! First, call the 'outer' function right away...
      laterFunc = method.apply(robot, args);
      // Then, later, set up to call the callback with the results of that
      // call.
      this.setFuture(this.time + time, robotId,
        function() {
          callback(laterFunc.apply(robot, args));
        },
        errback);
    }
};

GameLogic.prototype.makeRobot = function(robotId, name) {
  // Connects the robot with the given ID to the game. The slot must already
  // exist (Match will take care of that).
  assert.ok(!this.started, "You can't connect to a started match!");
  assert.ok(robotId in this.robots, "This robot doesn't exist!");
  if (this.robots[robotId]) {
    this.disconnectRobot(robotId);
  }

  // Time to actually make the robot.
  var rob = new robot.Robot(name,
    [Math.random() * this.field.width, Math.random() * this.field.height],
  this.field);

  for (var rid in this.robots) {
      if (this.robots.hasOwnProperty(rid) && this.robots[rid]) {
          assert.notEqual(name, this.robots[rid].name, "This robot already has that name!");
      }
  }

  this.robots[robotId] = rob;
  this.field.addObject(rob);
  this.emit("connectedRobot", this, robotId, rob);
  return rob;
};

GameLogic.prototype.disconnectRobot = function(robotId) {
  // Disconnects the given robot ID from the game. There must be a robot in
  // the given slot (eg you must have makeRobot'd before).
  assert.ok(!this.started, "You mustn't leave a started match!");
  assert.ok(robotId in this.robots, "This robot doesn't exist!");
  if (this.robots[robotId] === null) {
    // already disconnected
    return false;
  }
  var robot = this.robots[robotId];
  this.robots[robotId] = null;
  this.field.removeObject(robot);
  this.emit("disconnectedRobot", this, robot);
};

// AT Robots inspired game
// -----------------------
// This game is inspired by AT Robots. It includes the standard things such as
// firing bullets and breaking robots.
function ATRobotsGame() {
  GameLogic.apply(this, arguments);
}
sys.inherits(ATRobotsGame, GameLogic);

// Here come the lists of actions we can take.
// INSTANT is all the actions that we should return *right away.* Don't
// post to our 'futures' list, just... pop the callback RIGHT NAO.
ATRobotsGame.prototype.INSTANT = {
  setTurretRotate: roboproto.setTurretRot,
  getTurretRotate: roboproto.getTurretRot,
  getThrottle: roboproto.getThrottle
};

// DELAYED is all the actions that should be returned later. Save them on
// our futures, worry about it later. This mapping maps from action
// strings to a 2-tuple: [timeToWait, methodName]. Apply that methodName
// with arguments.
ATRobotsGame.prototype.DELAYED = {
  turn: [0, roboproto.turn], // call robot.turn
  getLocation: [3, roboproto.getLocation],
  getRotation: [2, roboproto.getRotation],
  setThrottle: [0, roboproto.setThrottle],
  getSpeed: [0, roboproto.getSpeed],
  fire: [1, roboproto.fire]
};

// PARTIAL_DELAYED is really crazy. These functions will actually return
// functions. Call the 'outer' function right away. Then, set up to call
// the 'inner' function later, in the future.
ATRobotsGame.prototype.PARTIAL_DELAYED = {
  scanRobots: [2, roboproto.scanRobots],
  scanWall: [1, roboproto.scanWall]
};

process.mixin(exports,
  {
    GameLogic: GameLogic,
    ATRobotsGame: ATRobotsGame
  }
);
