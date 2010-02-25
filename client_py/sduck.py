#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Sitting duck. We'll just spin in circles.
"""
from courier import RoboLink

robot = RoboLink.connect(name="Sitting Duck")
if not robot:
    print "Error connecting"
    exit(1)

while True:
    # Just sit here and spin in clockwise circles.
    robot.steer(1)

