// Fieldobject.js
// --------------
// These are all objects that go inside some field. Subclass this and use it for
// your own objects!
//
var
  sys    = require('sys'),
  events = require('events'),
  vector = require('./vector');

function FieldObject(field) {
  this.location = new vector.Vector(0,0);
  this.field = field;
  this.radius = 15;
}
sys.inherits(FieldObject, events.EventEmitter);

// This function is executed at every "time slice" of the game. It would do
// things like move the object, rotate, accelerate, or whatever. It usually gets
// called by Field.pump()
FieldObject.prototype.pump = function() {

};

FieldObject.prototype.toJSON = function() {
  return {
    location: [this.location.x, this.location.y]
  };
};

// This function gives everything the client needs to draw the object to the
// screen.
FieldObject.prototype.renderInfo = function() {
  return {
    type: 'object',
    location: [this.location.x, this.location.y]
  };
};

FieldObject.prototype.collidedWithWall = function() {
  // Field will call this function when the object tries to collide with the
  // wall.
};

FieldObject.prototype.isTangible = function(other) {
  // This will be called by other objects and field.move, among other things.
  // Don't make any changes to the object's state here!
  // Should we be moved out of the way? Return false if we're
  // a ghost and like going through other objects. Otherwise, return true.
  return true;
};

FieldObject.prototype.collidedWith = function(other) {
  // What happens when we collide with another object
  // other is the other object that collides with us.

  // This function gets called by 'field.move' when this object collides with
  // another object. Use other.isTangible(this) to see if you should do
  // anything.

  // Never call Field.move(this, Field.unOverlap(this, other)). The field is
  // smarter than we are and it will decide what to do.
};

process.mixin(exports,
  {
    FieldObject: FieldObject,
    NORTH: new vector.Vector(0, 1)
  }
);
