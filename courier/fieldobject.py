#!/usr/bin/env python
# -*- coding: utf-8 -*-

import field

class FieldObject(object):
    def __init__(self):
        self.location = vector.Vector([0, 0])

    def __json__(self):
        return {'location': self.location}

    def hit(self, damage):
        print str(self) + " hit"
        pass

    @property
    def x(self):
        return self.location[0]

    @property
    def y(self):
        return self.location[1]

    def bearing(self, b):
        """
        Return the bearing from a to b as seen on a's compass.

        |
        |
        |-.  this angle
        |  \ 
        a--.:___
                ''---..__
                         ''--b
        Will return a number within [-2pi, 2pi]
        """
        return field.NORTH.angle - (b.location - self.location).angle

    def pump(self):
        pass
