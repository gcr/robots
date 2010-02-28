#!/usr/bin/env python
# -*- coding: utf-8 -*-
import math
import random
import vector
import fieldobject
from twisted.internet.defer import Deferred

class Robot(fieldobject.FieldObject):
    """
    A server-side robot.
    """
    def __init__(self, name, field, location, scanner=5, weapon=2, armor=2,
            engine=2, heatsink=1,mines=0,shield=0):
        assert sum([scanner,weapon,armor,engine,heatsink,mines,shield]) <= 12, "You can only have 12 points"
        self.scanrange = [250,  350, 500, 700, 1000, 1500][scanner]
        self.weapon =    [0.5,  0.8,  1., 1.2, 1.35,  1.5][weapon]
        self.armor =     [ 50,   66, 100, 120,  130,  150][armor]
        self.engine = (  [0.5,  0.8,  1., 1.2, 1.35,  1.5][engine]
                       * [1.33, 1.2,  1., 0.8, 0.75, 0.66][armor])
        self.heatsink = [0.75, 1.0, 1.125, 1.25, 1.33, 1.5][heatsink]

        self.name = name
        self.throttle = 0 # How fast we WANT to go
        self.speed = 0 # How fast we're ACTUALLY going
        self.steer = random.uniform(0, 2*math.pi) # Where we WANT to turn
        self.rotation = self.steer # Where we ARE turning
        self.turret_rot = 0 # Where our turret is pointing
                            # relative to self.steer
        self.field = field
        self.location = vector.Vector(location)
        self.scan_width = 0
        self.scan_mode = ""
        self.heat = 0

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
                'scan_mode': self.scan_mode,
                'scan_width': self.scan_width,
                'scanrange': self.scanrange,
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
        - Reduces heat
        """
        if self.dead or self.heat > 350:
            return
        # change angles
        angle_diff = vector.angle_normalize(self.steer - self.rotation)
        rot_accel = self.engine/5
        if abs(angle_diff) < rot_accel:
            self.rotation += angle_diff
        else:
            self.rotation += rot_accel if angle_diff>0 else -rot_accel
        # change speeds
        speed_diff = self.throttle - self.speed
        accel = self.engine * 3
        if abs(speed_diff) < accel:
            self.speed += speed_diff
        else:
            self.speed += accel if speed_diff>0 else -accel
        # change positions
        self.location = self.location + vector.Vector(
                [math.sin(self.rotation),
                 math.cos(self.rotation)]) * self.speed

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
        the nearest target. Computed relative to the robot's steering.
        """
        if self.dead:
            raise RobotError("%s is too dead to scan!" % self.name)
        return vector.angle_normalize(
                self.bearing(min(
                    self.field.other_robots(self),
                    key=lambda other: (other.location - self.location).dist))
                - self.rotation)

    def turn(self, amount):
        """
        Steers ourselves by rotation.
        """
        self.steer = vector.angle_normalize(self.rotation + amount)
        return amount

    def set_throttle(self, amount):
        """
        Set our throttle to be between -self.engine*5 and self.engine*10
        This function expects a percentage.
        """
        amount = max(-.5, min(amount/100., 1))
        self.throttle = 10*self.engine*amount

    @property
    def dead(self):
        return self.armor <= 0

    def scan_robots(self, angle):
        """
        Takes a scan of the field. scan_end returns (distance, accuracy) to the
        nearest target where position could be False or a number and accuracy is
        inside [-2, 2] -- the angle. This returns a deferred; call it when you
        want to grab the results.
        """
        if self.dead:
            raise RobotError("%s is too dead to scan!" % self.name)
        assert -math.pi < angle < math.pi, "angle must be between -math.pi and math.pi (90 degrees)!"
        self.scan_width = angle
        self.scan_mode = "robots"
        def end_scan(*args):
            """
            Stops scanning. Return distance, accuracy.
            """
            assert self.scan_width, "We weren't scanning!"
            scan_width = self.scan_width
            hits = sorted(
                # Build a tuple of robots and our distances...
                [(other, (other.location - self.location).dist)
                    for other in self.field.other_robots(self)
                    # if they're within range...
                    if (other.location - self.location).dist < self.scanrange
                    # ...and if they're within our proper angle.
                    and abs(vector.angle_normalize(
                            self.bearing(other) - self.turret_absolute
                        )) < scan_width],
                # oh, and sort that by distance.
                lambda rob, dist: dist)
            self.scan_width = 0
            self.scan_mode = ""
            if hits:
                # return: distance, accuracy
                return (hits[0][1],
                    # accuracy: the angle to the other one divided by scan_width
                    # between negative two and positive two
                    round(2*vector.angle_normalize(
                        self.bearing(other) - self.turret_absolute)/scan_width
                   )/2)
            else:
                return None
        d = Deferred()
        d.addCallback(end_scan)
        return d

    def scan_wall(self):
        """
        Starts scanning for walls. Returns a deferred -- call it when you want
        the result.
        The deferred returns the distance to the closest wall in the direction
        the robot's currently heading. A little sonar beacon is mounted on the
        robot's nose. This is wrt to the turret's rotation.
        """
        self.scan_mode = "wall"
        def end_scan_wall(*args):
            self.scan_mode = ""
            dist =  self.field.dist_to_wall(self, self.turret_absolute)
            if dist < self.scanrange:
                return dist
            else:
                return None
        d = Deferred()
        d.addCallback(end_scan_wall)
        return d

    def collide_with_boundary(self):
        """
        What happens when our robot collides with the outer edge of the map.
        (Note that the field will handle relocating our object.)
        """
        self.field.hit(self, self.speed/30)
        self.speed, self.throttle = 0, 0

    @property
    def turret_absolute(self):
        """
        Return absolute turret location
        """
        return self.rotation + self.turret_rot

    def rotate_turret(self, angle):
        """
        Rotate the turret (always relative to self.rotation)
        """
        self.turret_rot = vector.angle_normalize(angle)

class RobotError(Exception):
    pass
