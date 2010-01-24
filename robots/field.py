#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math

def distance(a, b):
    """
    Utility function. Returns distance between object a and object b.
    """
    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

class Field:
    """
    A 1024x1024 playing field. Can hold robots, bullets, or whatever really.
    """
    def __init__(width=1024, height=1024):
        self.width = width
        self.height = height
        self.objects = []

    def splashdamage(self, (x, y)):
        """
        Calls the hit() method on every object at the given location. Returns
        true if something was hit, false otherwise.
        """
        pass

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

