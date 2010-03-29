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

process.mixin(exports,
  {
    Bullet: Bullet
  }
);
