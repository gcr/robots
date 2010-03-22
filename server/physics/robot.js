// robot.js -- OMG ROBOTS

var
  sys         = require('sys'),
  fieldobject = require('./fieldobject'),
  vec         = require('./vector');

function Robot(name, location) {
  this.name = name;
  this.location = new vec.Vector(location[0], location[1]);
  this.rotation = vec.normalizeAngle(Math.random() * 2 * Math.PI);
  this.turretRot = 0;
  this.scanMode = "";
  this.scanWidth = Math.PI / 6;
  this.scanRange = 500;
  this.speed = 0;
  this.armor = 100;
}
sys.inherits(Robot, fieldobject.FieldObject);

// Return enough information for a client to draw us on the screen.
Robot.prototype.renderInfo = function() {
  return {
    type: 'robot',
    name: this.name,
    location: [this.location.x, this.location.y],
    rotation: this.rotation,
    turret_rot: this.turretRot,
    scan_mode: this.scanMode,
    scan_width: this.scanWidth,
    scanrange: this.scanRange,
    speed: this.speed
  };
};

Robot.prototype.toJson = function() {
  return {
    name: this.name,
    armor: this.armor,
    heat: 1000000
  };
};

Robot.prototype.pump = function() {

};

Robot.prototype.turn = function(amount) {
    require('../log').debug("Turning: " + amount + " radians!");
};

process.mixin(exports,
  {
    Robot: Robot
  }
);
