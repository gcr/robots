#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math

def distance(a, b):
    """
    Utility function. Returns distance between object a and object b.
    """
    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

def bearing(a, b):
    """
    Return the bearing from a to b as seen on a's compass.

    |
    |
    |-.  this angle
    |  \ 
    a--.:___
            ''---..__
                     ''--b
    """
    return angle(vector.Vector([0, -1]), b.location - a.location)

class Field:
    """
    A 1024x1024 playing field. Can hold robots, bullets, or whatever really.
    """
    def __init__(self, width=1024, height=1024):
        self.width = width
        self.height = height
        self.objects = []

    def splashdamage(self, loc, damage)):
        """
        Calls the hit() method on every object at the given location. Returns
        true if something was hit, false otherwise.
        """
        for obj in self.objects:
            dist = (obj.location - loc).dist
            if dist > 20:
                obj.hit(float(damage) / dist)

    def add(self, obj):
        self.objects.append(obj)

    def remove(self, obj):
        self.objects.remove(obj)

class FieldObject(object):
    def __init__(self):
        self.location = [0, 0]
    def hit(self):
        pass
    @property
    def x(self):
        return self.location[0]
    @property
    def y(self):
        return self.location[1]

