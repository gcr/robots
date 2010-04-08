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

FieldObject.prototype.collidedWith = function(other, move) {
    // What happens when we collide with another object
    // other is the other object that collides with us.

    // The 'move' argument is true if we're the one who just called
    // Field.move() and false if some other object tried to Field.move() on
    // top of us.

    // This function gets called by 'field.move' when this object collides with
    // another object. Should we be moved out of the way? Return false if we're
    // a ghost and like going through other objects. Otherwise, return true.

    // Never call Field.move(this, Field.unOverlap(this, other)). The field is
    // smarter than we are and it will decide what to do.
    return true;
};

process.mixin(exports,
  {
    FieldObject: FieldObject
  }
);
