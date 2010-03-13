// gamelogic.js -- implements game logic.
//

var
  sys    = require('sys'),
  assert = require('assert'),
  events = require('events');

function GameLogic(match) {
  this.match = match;

  // A mapping.
  // this.futures = {
  //   time: [ [Function], [Function], ... ],
  //   time: [ [Function], ... ]
  // }
  this.futures = {};
  this.time = 0;

  this.started = false;

  // A mapping.
  // this.robots = { robot_id: Robot, robot_id: Robot, ... }
  this.robots = {};

}
sys.inherits(GameLogic, events.EventEmitter);

GameLogic.prototype.robotArray = function() {
  // an array of all the robots in this.robots
  var result = [];
  for (var robId in this.robots) {
    if (this.robots.hasOwnProperty(robId)) {
      result.push(this.robots[robId]);
    }
  }
  return result;
};

GameLogic.prototype.toJson = function() {
  return {
    field_size: [5, 5],
    speed: 5,
    started: false,
    robots: this.robotArray(),
    time: this.time
  };
};

GameLogic.prototype.pump = function() {
  // First. go through and carry out all these wonderful callbacks.
  for (var rid in this.futures[this.time]) {
    if (this.futures[this.time].hasOwnProperty(rid)) {
      this.futures[this.time][rid](this.time);
    }
  }
  delete this.futures[this.time];
  // this.field.pump() // NotImplementedError
  this.emit("pump", this, this.time);
  this.time += 1;
};

GameLogic.prototype.setFuture = function(time, robotId, cb) {
  // Rigs callback (cb) to be executed at time (time). The callback should
  // (should!) expect two arguments: a possible error, and the actual results of
  // the callback. By convention, of course; GameLogic.prototype.pump won't
  // care.
  assert.ok(time >= this.time, "That already happened!");

  // But first, we should go through our futures and ensure that no other
  // actions are pending for this robot.
  for (var ftime in this.futures) {
    if (this.futures.hasOwnProperty(ftime)) {
      if (robotId in this.futures[ftime]) {
        // Cancel that! First argument is a callback.
        this.futures[ftime][robotId]("Tried to do two things at once!");
      }
    }
  }
  this.futures[time] = this.futures[time] || {};
  this.futures[time][robotId] = cb;
};

GameLogic.prototype.makeRobot = function(robotId, name) {
  // Connects the robot with the given ID to the game. The slot must already
  // exist (Match will take care of that).
  assert.ok(!this.started, "You can't connect to a started match!");
  assert.ok(robotId in this.robots, "This robot doesn't exist!");
  if (this.robots[robotId]) {
    this.disconnectRobot(robotId);
  }

  // todo: maybe this should be an actual robot and not just a string. i dunno
  // you guys.
  var robot = name;
  this.robots[robotId] = robot;
  this.emit("connectedRobot", this, robot);
  return robot;
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
  this.emit("disconnectedRobot", this, robot);
};

process.mixin(exports,
  {
    GameLogic: GameLogic
  }
);
