#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math
import random
import field

class Robot(field.FieldObject):
    def __init__(name, (x, y), scanner=5, weapon=2, armor=2, engine=2,
            heatsink=1):
        self.name = name
        self.throttle = 0 # How fast we WANT to go
        self.speed = 0 # How fast we're ACTUALLY going
        self.steer = random.uniform(0, 2*math.pi) # Where we WANT to turn
        self.rotation = self.steer # Where we ARE turning
        self.turret_rot = 0 # Where our turret is pointing relative to self.steer
        self.location = [x, y]
        self.scan_width = math.pi / 2
        self.heat = 0

        assert sum(scanner,weapon,armor,engine,heatsink,mines,shield) <= 12, "You can only have 12 points"
        self.scanrange = [250,  350, 500, 700, 1000, 1500][scanner]
        self.weapon =    [0.5,  0.8,  1., 1.2, 1.35,  1.5][weapon]
        self.armor =     [ 50,   66, 100, 120,  130,  150][armor]
        self.engine = (  [0.5,  0.8,  1., 1.2, 1.35,  1.5][engine]
                       * [1.33, 1.2,  1., 0.8, 0.75, 0.66][armor])
        self.heatsink = [0.75, 1.0, 1.125, 1.25, 1.33, 1.5][heatsink]
             
    def pump(self):
        """
        Performs time-sensitive actions over a tic.
        - Accelerates or decelerates
        - Rotates self by ever so much
        - Detects collisions against robots and other walls, stops and hits self
          if necessary.
        - Reduces heat
        """
        pass

    def destruct(self):
        """
        Self-destructs.
        """
        self.armor = -10
        self.field.splashdamage(self.location)

    def sonar(self):
        """
        Does sonar. This takes a scan of the field and returns the bearing to
        the nearest target.
        """
        pass

    @property
    def dead(self):
        return self.health > 0

    def scan(self):
        """
        Takes a scan of the field. Returns (position, accuracy) to the nearest
        target where position could be False or a number and accuracy is inside
        [-2, 2] -- the angle
        """
        pass

    @property
    def turret_absolute(self):
        """
        Return absolute turret location
        """
        return self.steer + self.turret_rot

