#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Sitting duck. We'll just spin in circles.
"""
from courier import RoboLink
import random

robot = RoboLink.connect(name="Sitting Duck")

if not robot:
    print "Error connecting"
    exit(1)

while True:
    # Just sit here and spin in clockwise circles.
    robot.turret_rotation = random.randint(0, 365)
    robot.turn(90)

