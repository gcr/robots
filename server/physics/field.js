// field.js -- holds fields
//

var
  sys    = require('sys'),
  events = require('events'),
  vec    = require('./vector');

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
    this.emit("removedObject", this, obj);
    return obj;
  } else {
    return false;
  }
};

Field.prototype.pump = function() {
  // Note: we're not optimizing this loop because this.objects may change
  // while we iterate over it.
  var l = this.objects.length;
  for (var i=0; i<l; i++) {
    this.objects[i].pump();
    // If our number of objects shrunk while we iterate over it
    // The Math.max logic is to filter out if our list grows -- we don't want
    // to pump an object twice, now!
    i = i - Math.max(0, l-this.objects.length);
    l = this.objects.length;
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
  if (obj.location.x < 0 || obj.location.x > this.width ||
      obj.location.y < 0 || obj.location.y > this.height) {
    // ONOES they hit something!
    obj.collidedWithWall();
    obj.location.x = Math.min(this.width, Math.max(0, obj.location.x));
    obj.location.y = Math.min(this.height, Math.max(0, obj.location.y));
  }

  // Now: loop through every other object and see if this object collides with
  // it
  for (var i=0,l=this.objects.length; i<l; i++) {
    if (this.objects[i] !== obj) {
      // Test for collision between obj and this.objects[i]
      // TODO: find a better algorithm; preferably one that's not O(n^2)
      if (this.objects[i].location.sub(obj.location).dist() <
        (this.objects[i].radius + obj.radius)) {
          obj.collidedWith(this.objects[i], true);
          this.objects[i].collidedWith(obj, false);
          // TODO: Move them out of the way
          // break; ? only collide w/ one object?
      }
    }
  }
};

Field.prototype.unOverlap = function(a, b) {
    // Given two OVERLAPPING  objects a, b, this returns the smallest vector
    // by which to move A so they're no longer overlapping. Two quick notes:
    // This assumes they're both overlapping and will return bogus results if
    // not, and it also assumes both are circular. Also note: Needs to be
    // tested for two objects of different radii.
    //      ,
    //     /     Dx
    //    ; +----------+b
    //    | |         /
    //  ,-:-|---. dx /
    // '   \|   +---/   D = distance from a to b
    //      | dy|  /`-.
    //    Dy|\  | /d   `.
    //      | `.|/       \     ,
    //      |   /-.       \ ,-'
    //      |  /   `-------:
    //      | /            :
    //      |/              :
    //     a+               |
    //                      ;
    //
    // Using similar triangles (see the diagram in my head):
    var Dx = b.location.x - a.location.x,
        Dy = b.location.y - a.location.y,
        // D is the distance between them
        D = Math.sqrt(Dx*Dx + Dy*Dy),
        // d is the distance we must move them. (variables are case sensitive.)
        d = D - (a.radius + b.radius);
        // ...but what direction? Problem: Find dx and dy.
        // By similar triangles, we know that D/d = Dx/dx = Dy/dy
        // Therefore, Dx/D * d = dx; likewise for dy
    return new vec.Vector(
      d*Dx/D, // this is dx
      d*Dy/D  // this is dy
    );
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

Field.prototype.distToWall = function(location, rotation) {
  // Returns the distance from location (pointing at rotation) to the wall.
  //        (wallx, wally)
  // +---------+-------------+
  // |        /              |
  // |       /               |
  // |      /                |
  // |     / dist            |
  // |    /                  |
  // |   /                   |
  // |  O                    |
  // |                       |
  // +-----------------------+
  // Do this by building a line. y=mx+b. Find points along x=0 and
  // x=self.width. Find the distance between the location and these points.
  var v = new vec.Vector(Math.sin(rotation), Math.cos(rotation)),
      m, wallx, wally;
  // Test for left and right walls
  if (v.x !== 0) {
    // assert: we're not facing straight up or down. if we are, by definition
    // we're not facing the left or right walls.
    m = v.y / v.x;
    // m is the slope of our line
    wallx = v.x>0? this.width : 0;
    // Are we facing left? if so, test against left wall; else test against
    // the right wall.
    wally = location.y + m*(wallx-location.x);
    if (0 < wally && wally < this.height) {
      // success! the intersect point isn't above the top of the wall and it
      // isn't below the bottom. Return the distance.
      return (new vec.Vector(wallx, wally).sub(location)).dist();
    }
  }
  // no match along left/right walls? test for x then along the top and bottom
  // walls. This is exactly the opposite as before.
  m = v.x / v.y;
  wally = v.y<0? 0 : this.height;
  wallx = location.x + m*(wally - location.y);
  // if we didn't match a left or right wall, we MUST match along the top or
  // bottom because we're always inside the square.
  return (new vec.Vector(wallx, wally).sub(location)).dist();
};

process.mixin(exports,
  {
    Field: Field
  }
);
