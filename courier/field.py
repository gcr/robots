#!/usr/bin/env python
# -*- coding: utf-8 -*-
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
        # a callback
        self.on_splash_cb = None
        self.on_hit_cb = None
        self.on_pump_cb = None

    def on_pump(self, f):
        """
        Will run this callback every time we 'pump' the field. The argument
        to the callback will be the list of objects.
        """
        self.on_pump_cb = f

    def on_splash(self, f):
        """
        Assigns a callback to be run on splashdamage. This callback
        will contain all objects within the vicinity of the splash damage
        along with the location of the focal point. The objects list is [(obj,
        damage), (obj, damage), ...]
        """
        self.on_splash_cb = f

    def on_hit(self, f):
        """ Assigns a callback to be called whenever an object is hit. This
        callback will be passed the object that was hit and its location. """
        self.on_hit_cb = f

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
        hit_objs = []
        for obj in self.objects:
            dist = (obj.location - loc).dist
            if dist > 20:
                d = float(damage) / dist
                hit_objs.append(obj, d)
                obj.hit(d)
        if self.on_splash_cb:
            self.on_splash_cb(hit_objs, loc, damage)

    def add(self, obj):
        self.objects.append(obj)

    def pump(self):
        for obj in self.objects:
            obj.pump()
        if self.on_pump_cb:
            self.on_pump_cb(self)

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

