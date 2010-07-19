// bullet.js
// ---------
// This file describes bullets that ROAM AROUND THE FIELD and BUMP INTO STUFF!

var
  sys = require('sys'),
  robot = require('./robot'),
  vec = require('./vector'),
  fieldobject = require('./fieldobject');

function Bullet(field, owner, startlocation, rotation) {
  // Create a bullet.
  // field is the game's field. Be sure to add me!
  // owner is the robot who fired me. No friendly fire here!
  // startlocation is where I'm fired.
  // rotation is where I'm headed.
  this.field = field;
  this.owner = owner;
  this.location = startlocation;
  this.rotation = rotation;
  this.radius = 20;
}
sys.inherits(Bullet, fieldobject.FieldObject);

Bullet.prototype.pump = function() {
  // Move ourselves about the field
  this.field.move(
    this,
    new vec.Vector(
      Math.sin(this.rotation),
      Math.cos(this.rotation)
    ).multiply(25)
  );
};

Bullet.prototype.isTangible = function(other) {
  // Go through our owner; hit other robots
  return (other !== this.owner && !(other instanceof Bullet));
};

Bullet.prototype.collidedWith = function(other) {
  if (other instanceof robot.Robot && other !== this.owner) {
    // KABLOO!
    this.emit("hitRobot", this, other);
    this.field.removeObject(this);
  }
};

Bullet.prototype.collidedWithWall = function() {
  // BOOMIE!
  this.field.removeObject(this);
};

// Return enough information for a client to draw us on the screen.
Bullet.prototype.renderInfo = function() {
  return {
    type: 'bullet',
    location: [this.location.x, this.location.y],
    rotation: this.rotation
  };
};

Bullet.prototype.hitQuality = function(other) {
  // Returns the 'quality' of the shot; how close our path passes to other's
  // location. See: "Graphics Gems" (Glassner, 1990) pg. 9-10; "Graphics Gems
  // II" (James Arvo, 1991) pg. 5-6
  // Step 1. Find point on the ray from us with our direction closest to
  // other.location
  // Step 2. Find distance from this.location to that point.

  // 1. lnormal is the vector perpendicular to our heading (keep in mind our
  // funky coordinate system).
  var lnormal = new vec.Vector(
      -Math.cos(this.rotation), // -y
      Math.sin(this.rotation) // x
    );

  //      other
  //         :
  //          : lnormal
  //          :          ___...---'''
  //        ___:..---'''
  // ---''us    Q
  var q = lnormal.dot(other.location) - lnormal.dot(this.location);
  var Q = other.location.sub(lnormal.multiply(q));
  //Q = Point on Line l nearest other.location

  // 2. Distance
  var d = other.location.sub(Q).dist();

  // 3. How good was the hit?
  return 1- d / (this.radius+other.radius);

};

exports.Bullet = Bullet;
