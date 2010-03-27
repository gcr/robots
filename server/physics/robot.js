// robot.js -- OMG ROBOTS

var
  sys         = require('sys'),
  assert      = require('assert'),
  fieldobject = require('./fieldobject'),
  vec         = require('./vector'),
  NORTH       = new vec.Vector(0, 1);

function Robot(name, location, field) {
  this.name = name;
  this.field = field;
  this.location = new vec.Vector(location[0], location[1]);
  this.rotation = vec.normalizeAngle(Math.random() * 2 * Math.PI);
  this.wantedRotation = this.rotation;

  this.engine = 1;
  this.turretRot = 0;
  this.scanMode = "";
  this.scanWidth = Math.PI / 6;
  this.scanRange = 500;
  this.speed = 0;
  this.throttle = 0;
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

Robot.prototype.toJSON = function() {
  return {
    name: this.name,
    armor: this.armor
  };
};

Robot.prototype.pump = function() {
  // Calculate our physics: turn, move, or whatever.
  // First, we'll turn.
  var angleDiff = vec.normalizeAngle(this.wantedRotation - this.rotation),
      rotAccel = this.engine/5;
  if (Math.abs(angleDiff) < rotAccel) {
    this.rotation = this.wantedRotation;
  } else {
    this.rotation += angleDiff>0? rotAccel : -rotAccel;
  }
  this.rotation = vec.normalizeAngle(this.rotation);

  // Now, do throttle!
  var speedDiff = this.throttle - this.speed,
      accel = this.engine * 3;
  if (Math.abs(speedDiff) < accel) {
    this.speed += speedDiff;
  } else {
    this.speed += speedDiff>0? accel : -accel;
  }

  // Now, change our location!
  this.field.move(this,
    new vec.Vector(
      Math.sin(this.rotation),
      Math.cos(this.rotation)
    ).multiply(this.speed));
};

Robot.prototype.turn = function(amount) {
  this.wantedRotation = this.rotation + amount;
  return amount;
};

Robot.prototype.bearingTo = function(location) {
    // Return the direction (in radians) from our nose to the given vector
    // |
    // |
    // |-.  this angle
    // |  \ 
    // us-.:___      -   -   - the angle our vector library expects
    //         ''---..__
    //                  ''--location
    var angle = location.sub(this.location).angleTo(NORTH);
    angle = location.sub(this.location).x>0? angle : -angle;
    return vec.normalizeAngle(
      // Negative because the vector library is counting CCW and we want CW
      angle - this.rotation
    );
};

Robot.prototype.turretBearingTo = function(location) {
    // Return the direction (in radians) from our nose to the given vector
    // |   /turret angle
    // |  /
    // | /. return this angle
    // |/  \
    // us-.:___      -   -   - the angle our vector library expects
    //         ''---..__
    //                  ''--location
    var angle = location.sub(this.location).angleTo(NORTH);
    angle = location.sub(this.location).x>0? angle : -angle;
    return vec.normalizeAngle(
      // Negative because the vector library is counting CCW and we want CW
      angle - (this.rotation + this.turretRot)
    );
};

Robot.prototype.distanceTo = function(location) {
    return this.location.sub(location).dist();
};

Robot.prototype.getTurretRot = function() {
  return this.turretRot;
};

Robot.prototype.setTurretRot = function(newRot) {
  this.turretRot = vec.normalizeAngle(newRot);
  return newRot;
};

Robot.prototype.getLocation = function() {
  return [this.location.x, this.location.y];
};

Robot.prototype.setThrottle = function(throttle) {
  // Set throttle. The minimum we can have is -self.engine*5 and the max we
  // can have is self.engine*10.
  // This expects a number between -50 and 100.
  var amount = Math.max(-50, Math.min(throttle, 100));
  this.throttle = 10 * this.engine * amount/100;
  return this.throttle;
};

Robot.prototype.getThrottle = function() {
  return this.throttle;
};

Robot.prototype.scanRobots = function(scanWidth) {
    // Scan for robots! Returns a function that, when called, will scan for
    // other robots.
    assert.ok(scanWidth <= Math.PI/2, "You can only scan 90° to one side.");
    this.scanWidth = scanWidth;
    this.scanMode = "robots";
    var self = this; // for closure
    return function() {
      self.scanMode = "";
      return self.field.allObjectsWithin(self.location, self.scanRange).filter(
        function(obj) {
          return (obj instanceof Robot) &&
                 (obj !== self);
        });
    };
};

process.mixin(exports,
  {
    Robot: Robot
  }
);
