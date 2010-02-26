#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Tracker.

We'll just sit there and track you forever.

"""
from courier import RoboLink
from math import pi

robot = RoboLink.connect(name="Tracker")

if not robot:
    print "Error connecting"
    exit(1)

# The max we can scan
biggest_arc = pi
# How thin our arc is. As factor increases, our arc grows finer.
factor = 1

while True:
    # Scan for a robot
    scan_results = robot.scan(biggest_arc / (2**factor))

    if scan_results:
        # If we found them, record their distance and accuracy (will be either
        # -1, -.5, 0, .5, 1; the angle is this times your scan width)
        dist, accuracy = scan_results
        # Steer to face our target
        robot.steer(accuracy * biggest_arc / (2**factor))
        factor += 1
    else:
        # We couldn't find them; our arc is too narrow. Back off a bit.
        factor -= 2

    if factor <= 0:
        # If we're as coarse as we can get, just spin around a little.
        factor = 1
        robot.steer(pi/2)

