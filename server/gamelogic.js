// gamelogic.js -- implements game logic.
//

var
  sys    = require('sys'),
  events = require('events');

// here's the python code for all these callbacks. we'll need ears for all these.
//   def on_pump(field):
//       self.history.add({"field": field})
//   def on_hit(obj, location):
//       self.history.add({"hit": {'obj': obj, 'location': location}})
//   def on_splash(obj, location, damage):
//       self.history.add({"splash_damage":
//           {"objects": obj, "location": location, "damage": damage}})
//   def on_remove_slot():
//       self.history.add({"remove_slot": True})
//   def on_disconnect_robot(robot):
//       self.history.add({"disconnect_robot": robot})
//   def on_new_robot(robot):
//       self.history.add({"connected_robot": robot})

function GameLogic() {
  // A mapping.
  // this.future = {
  //   time: [ [Function], [Function], ... ],
  //   time: [ [Function], ... ]
  // }
  this.future = {};
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


process.mixin(exports,
  {
    GameLogic: GameLogic
  }
);
