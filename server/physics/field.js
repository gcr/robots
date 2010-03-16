// field.js -- holds fields
//

var
  sys = require('sys'),
  events = require('events');

function Field(width, height) {
  // A field is like an arena of sorts. This one is just square; it has a
  // width and a height and won't bother anybody. Each field has objects and
  // stuff.
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

Field.prototype.toJson = function() {
  return {
    objects: this.objects,
    width: this.width,
    height: this.height
  };
};

process.mixin(exports,
  {
    Field: Field
  }
);
