#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math
import vector
import robot

# NOTE: we're on CARTESIAN coordinates.
NORTH = vector.Vector([0, 1])

class Field:
    """
    A 1024x1024 playing field. Can hold robots, bullets, or whatever really.
    """
    def __init__(self, width=1024, height=1024):
        self.width = width
        self.height = height
        self.objects = []

    def __json__(self):
        """
        Return a JSON representation of this field.
        """
        return {'width': self.width,
                'height': self.height,
                'objects': self.objects}

    def splashdamage(self, loc, damage):
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

    def pump(self):
        for obj in self.objects:
            obj.pump()

    def remove(self, obj):
        self.objects.remove(obj)

    @property
    def robots(self):
        """
        Return the robots in self.objects
        """
        return [obj for obj in self.objects if isinstance(obj, robot.Robot)]

    def other_robots(self, r):
        """
        Return all robots other than r
        """
        return [obj for obj in self.objects if r != obj]

