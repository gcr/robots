#!/usr/bin/env python
# -*- coding: utf-8 -*- 
"""
Some aux. classzorz for simple vector arithmatic
"""
import math

def angle(a,b):
    """
    I'm making this a helper function because object-orientation stinks. I like
    to think of it not as one vector comparing its angle to another vector, but
    simply the angle_between(vector1, vector2).
    """
    # Dot product of A, B = |A||B|cos(θ)
    # ⇒ cos(θ) = D ÷ (|A||B|)
    # ⇒ θ = acos(D ÷ (|A||B|))
    return math.acos(a*b / (abs(a.dist) * abs(b.dist)))

def angle_normalize(angle):
    """
    Given an angle in radians, will return an equivalent angle between
    [-pi, pi]
    """
    return (angle + math.pi) % (2*math.pi) - math.pi

def rotate(v, a):
    """Rotate a 2D vector by some angle in radians, a.
    rotate(0, 1, math.radians(90)) will rotate the point (0, 1) 90° about the
    origin and return (-1, 0). Warning: Will ignore the Z component."""
    x, y = v
    return Vector([x*math.cos(a) -y*math.sin(a), 
            x*math.sin(a) + y*math.cos(a)])

def projection(a,b):
    """
    Projection of A onto B. It will have the right length, but B's direction.
    """
    u = b.dir
    u.dist = a*u
    return u

class Vector(list):
    def __add__(self, other):
        return Vector([p+q for p,q in zip(self,other)])

    def __mul__(self, other):
        " Dot product "
        return sum([p*q for p,q in zip(self, other)])

    def __div__(self, other):
        pass
    
    def __sub__(self, other):
        return Vector([p-q for p,q in zip(self,other)])

    def __str__(self):
        return "<%s>" % ", ".join([str(elt) for elt in self])

    def _get_dist(self):
        return math.sqrt(sum([x**2 for x in self]))

    def _set_dist(self, newdist):
        ratio = float(self.dist / newdist)
        for n, x in enumerate(self):
            self[n] = x/ratio
    dist = property(_get_dist, _set_dist)

    @property
    def unitp(self):
        return self.dist == 1

    @property
    def dir(self):
        """ Return a unit vector that points in the same direction """
        u = Vector(self)
        u.dist = 1
        return u

    @property
    def angle(self):
        """ Returns an angle in radians from the positive X axis """
        tmp = angle(Vector([1,0]), self)
        return tmp if self[1] >= 0 else -tmp

if __name__ == "__main__":
    print "------ Vectors ------"
    x = Vector([2,3,4,5])
    y = Vector([1,2,3,4])
    print "x=%s   y=%s" % (x,y)
    print "x+y = %s\nx*y = %s" % (x+y, x*y)
    print "Distance of x: %f" % x.dist

    print "\n\n------ Unit vectors ------"

    print "x is a unit vector" if x.unitp else "x is not a unit vector"
    print "A unit vector of x is %s" % x.dir
    print "x is still %s" % x
    z = Vector([3./5,4./5,0])
    print "%s is a unit vector" % z if z.unitp else "%s is not a unit vector" % z
    x.dist = 2
    print "x now has distance of 2: %s" % x


    print "\n\n------ Angles ------"
    r = Vector([9, 0])
    p = Vector([1, math.sqrt(3)])
    print "Angle between %s and %s is %f" % (r, p, angle(r,p))
    print "(That's %f° btw)" % math.degrees(angle(p,r))

    x,y = Vector([1,1]), Vector([-1,-2])
    print "Angle between %s and %s is %f" % (x,y,math.degrees(angle(x,y)))

    print "\n\n------ Projections ------"
    print p
    print "That vector projected against a 45° going up and to the right:"
    print projection(p, Vector([1,1]))
    print "\n\n------ Rotations ------"
    print Vector([5, 3])
    print "Rotated 45° ccw:"
    print rotate(Vector([5, 3]), math.radians(45))
