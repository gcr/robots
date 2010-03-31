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

FieldObject.prototype.collidedWith = function(other) {
    // What happens when we collide with another object
    // other is the other object that collides with us.
};

process.mixin(exports,
  {
    FieldObject: FieldObject
  }
);
