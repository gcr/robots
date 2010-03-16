// Vector manipulation

function Vector(x, y) {
  // Vector. Sorta immutable; none of these methods actually make any permanent
  // changes to the object.
  this.x = x;
  this.y = y;
}

Vector.prototype.add = function(other) {
  // Return a copy of this added to other
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.sub = function(other) {
  return new Vector(this.x - other.x, this.y - other.y);
};

Vector.prototype.multiply = function(d) {
  return new Vector(this.x*d, this.y*d);
};

Vector.prototype.dot = function(other) {
  // Returns the dot product of this against the other
  return this.x * other.x + this.y * other.y;
};

Vector.prototype.dist = function() {
  // Returns or sets the vector's distance, and by "set" we really mean "returns
  // a copy of this vector with the new distance"
  if (typeof arguments[0] == 'undefined') {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  } else {
    return this.toUnit().multiply(arguments[0]);
  }
};

Vector.prototype.toUnit = function() {
  // Returns a unit vector of us
  return this.multiply(1/this.dist());
};

Vector.prototype.angleTo = function(other) {
  // Dot product of A, B = |A||
  // => cos(θ) = D ÷ (|A||B|)
  // => θ = acos(D ÷ (|A||B|))
  return Math.acos(this.dot(other) / (Math.abs(this.dist()) * Math.abs(other.dist())));
};

Vector.prototype.copy = function() {
  // Return a copy of this vector
  return new Vector(this.x, this.y);
};

Vector.prototype.rotated = function(a) {
  // Return a new vector that's a copy of this vector rotated by a radians
  return new Vector(this.x * Math.cos(a) - this.y*Math.sin(a),
                    this.x * Math.sin(a) + this.y*Math.cos(a));
};

Vector.prototype.projectedOn = function(other) {
  // Return a copy of ourselves projected to another vector. This vector will
  // have other's direction, but the correct length.
  var u = other.toUnit();
  return u.dist(this, u);
};

function normalizeAngle(angle) {
  // Given an angle in radians, will return an equivalent angle between
  // [-pi, pi]
  return (angle + Math.PI) % (2*Math.PI) - Math.PI;
}


process.mixin(exports,
  {
    Vector: Vector,
    '2DVector': Vector,
    normalizeAngle: normalizeAngle
  }
);
