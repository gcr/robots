// field.js -- holds fields
//

var
  sys = require('sys'),
  events = require('events');

function Field(game, width, height) {
  // A field is like an arena of sorts. This one is just square; it has a
  // width and a height and won't bother anybody. Each field has objects and
  // stuff.
  this.game = game;
  this.width = width;
  this.height = height;
  this.objects = [];
}
sys.inherits(Field, events.EventEmitter);

Field.prototype.addObject = function(obj) {
  this.objects.push(obj);
  this.emit("addedObject", this, obj);
};

Field.prototype.removeObject = function(obj) {
  var idx = this.objects.indexOf(obj);
  if (idx != -1) {
    this.objects.splice(idx, 1);
    return obj;
  } else {
    return false;
  }
};

Field.prototype.pump = function() {
  for (var i=0,l=this.objects.length; i<l; i++) {
    this.objects[i].pump();
  }
  this.emit("pump", this);
};

Field.prototype.toJSON = function() {
  return {
    objects: this.objects.map(function(obj) { return obj.renderInfo(); }),
    width: this.width,
    height: this.height
  };
};

Field.prototype.move = function(obj, displacement) {
  // Moves obj (changes obj.location) to be offset by displacement
  // Simple for now. In the future when we do quadtrees or whatever, we'll
  // want to make this more sophisticated -- multisampling or sweeping for
  // quick-movin' objects, etc. But not yet.
  obj.location = obj.location.add( displacement );
  obj.location.x = Math.min(this.width, Math.max(0, obj.location.x));
  obj.location.y = Math.min(this.height, Math.max(0, obj.location.y));
};

Field.prototype.allObjectsWithin = function(location, radius) {
    // Return a list of all the objects within radius of the given location
    return this.objects.filter(function(obj) {
      return (location.sub(obj.location)).dist() < radius;
    }).sort(function(a, b) {
      return ((location.sub(a.location)).dist() -
              (location.sub(b.location)).dist());
    });
};

process.mixin(exports,
  {
    Field: Field
  }
);
