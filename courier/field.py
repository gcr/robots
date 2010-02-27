#!/usr/bin/env python
# -*- coding: utf-8 -*-
import vector
import math
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

    def __json__(self):
        """
        Return a JSON representation of this field.
        """
        return {'objects': [obj.field_info() for obj in self.objects]}

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

    def hit(self, obj, damage):
        obj.hit(damage);
        if self.on_hit_cb:
            self.on_hit_cb(obj, damage)

    def add(self, obj):
        self.objects.append(obj)

    def pump(self):
        for obj in self.objects:
            obj.pump()
            x, y = obj.location
            if 0 > x or self.width < x:
                # Out of bounds
                self.hit(obj, obj.speed/30)
                obj.speed = 0
                obj.throttle = 0
                obj.location[0] = max(0, min(x, self.width))
            if 0 > y or self.height < y:
                self.hit(obj, obj.speed/30)
                obj.speed = 0
                obj.throttle = 0
                obj.location[1] = max(0, min(y, self.height))

        if self.on_pump_cb:
            self.on_pump_cb(self)

    def remove(self, obj):
        self.objects.remove(obj)

    def dist_to_wall(self, obj, rotation):
        """
        Returns the distance to the closest wall WRT obj's rotation

                (wallx, wally)
         +---------+-------------+
         |        /              |
         |       /               |
         |      /                |
         |     / dist            |
         |    /                  |
         |   /                   |
         |  O                    |
         |                       |
         +-----------------------+
        """

        # Do this by building a line. y=mx+b. Find points along x=0 and
        # x=self.width. Find the distance between the robot and these points.
        v = vector.Vector([math.sin(rotation), math.cos(rotation)])
        # Test for left and right walls
        if v[0] != 0:
            # assert: we're not facing straight up or down. if we are, by
            # definition we're not facing the left or right walls
            m = v[1] / v[0]
            # m is the slope of our line
            wallx = 0 if v[0] < 0 else  self.width
            # are we facing left? if so, test against left wall; else test
            # against right wall
            wally = obj.y + m*(wallx-obj.x)
            # wally is the y-coordinate of the intersection along the wall. we
            # already know the x-coordinate: wallx
            if 0 < wally < self.height:
                # success! the intersect point isn't above the top of the wall
                # and it isn't below the bottom. return distance.
                return (vector.Vector([wallx, wally]) - obj.location).dist
        # no match along left/right walls? test for x then along the top and
        # bottom walls. This is exactly the opposite as before.
        m = v[0] / v[1]
        wally = 0 if v[1] < 0 else self.height
        wallx = obj.x + m*(wally - obj.y)
        # if we didn't match a left or right wall, we MUST match along the top
        # or bottom because we're always inside the square.
        return (vector.Vector([wallx, wally]) - obj.location).dist

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

