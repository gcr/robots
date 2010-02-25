#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math
import random
import vector
# we import field just because
import field
import fieldobject

class Robot(fieldobject.FieldObject):
    """
    A server-side robot.
    """
    def __init__(self, name, field, location, scanner=5, weapon=2, armor=2,
            engine=2, heatsink=1,mines=0,shield=0):
        self.name = name
        self.throttle = 0 # How fast we WANT to go
        self.speed = 0 # How fast we're ACTUALLY going
        self.steer = random.uniform(0, 2*math.pi) # Where we WANT to turn
        self.rotation = self.steer # Where we ARE turning
        self.turret_rot = 0 # Where our turret is pointing
                            # relative to self.steer
        self.field = field
        self.location = vector.Vector(location)
        self.scan_width = math.pi / 2
        self.heat = 0

        assert sum([scanner,weapon,armor,engine,heatsink,mines,shield]) <= 12, "You can only have 12 points"
        self.scanrange = [250,  350, 500, 700, 1000, 1500][scanner]
        self.weapon =    [0.5,  0.8,  1., 1.2, 1.35,  1.5][weapon]
        self.armor =     [ 50,   66, 100, 120,  130,  150][armor]
        self.engine = (  [0.5,  0.8,  1., 1.2, 1.35,  1.5][engine]
                       * [1.33, 1.2,  1., 0.8, 0.75, 0.66][armor])
        self.heatsink = [0.75, 1.0, 1.125, 1.25, 1.33, 1.5][heatsink]

    def __json__(self):
        return {'name': self.name,
                'armor': self.armor,
                'heat': self.heat}

    def field_info(self):
        # return enough information for the client to draw on the screen. This
        # should usually be kept secret (ie not in self.__json__).
        return {'type': 'robot',
                'name': self.name,
                'location': self.location,
                'rotation': self.rotation,
                'turret_rot': self.turret_rot,
                'speed': self.speed,
               }

    def __str__(self):
        return "<Robot '%s' (%s armor)>" % (self.name, self.armor)

    def __repr__(self):
        return str(self)
             
    def pump(self):
        """
        Performs time-sensitive actions over a tic.
        - Accelerates or decelerates
        - Rotates self by ever so much
        - Detects collisions against robots and other walls, stops and hits self
          if necessary.
        - Reduces heat
        """
        if not self.dead and self.heat < 350:
            angle_diff = vector.angle_normalize(self.steer - self.rotation)
            if angle_diff < 0:
                self.rotation -= min(abs(angle_diff), self.engine/10)
            elif angle_diff > 0:
                self.rotation += min(abs(angle_diff), self.engine/10)

    def hit(self, damage):
        """
        We were hit!
        """
        if not self.dead:
            self.armor -= damage
            if self.dead:
                self.destruct()

    def fire(self):
        """
        Fire a new shot; add it to the field.
        """
        if self.dead:
            raise RobotError("%s is too dead to fire!" % self.name)
        pass

    def destruct(self):
        """
        Self-destructs.
        """
        if self.dead:
            raise RobotError("%s is too dead to self destruct!" % self.name)
        self.armor = -10
        self.speed = 0
        self.throttle = 0
        self.field.splashdamage(self.location, 20)

    def sonar(self):
        """
        Does sonar. This takes a scan of the field and returns the bearing to
        the nearest target. Computed relative to the tank's steering.
        """
        if self.dead:
            raise RobotError("%s is too dead to scan!" % self.name)
        return vector.angle_normalize(
                self.bearing(min(
                    self.field.other_robots(self), 
                    key=lambda other: (other.location - self.location).dist))
                - self.rotation)

    def steer_by(self, amount):
        """
        Steers ourselves by rotation.
        """
        self.steer = vector.angle_normalize(self.steer + amount)
        return amount

    @property
    def dead(self):
        return self.armor <= 0

    def scan(self):
        """
        Takes a scan of the field. Returns (position, accuracy) to the nearest
        target where position could be False or a number and accuracy is inside
        [-2, 2] -- the angle
        """
        if self.dead:
            raise RobotError("%s is too dead to scan!" % self.name)
        pass

    @property
    def turret_absolute(self):
        """
        Return absolute turret location
        """
        return self.steer + self.turret_rot

class RobotError(Exception):
    pass
