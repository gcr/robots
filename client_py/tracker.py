#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Tracker.

We'll just sit there and track you forever, halving our scan arc each step.
"""
from courier import RoboLink

robot = RoboLink.connect(name="Tracker")

if not robot:
    print "Error connecting"
    exit(1)

# The max we can scan
biggest_arc = 90.
# How thin our arc is. As factor increases, our arc grows finer.
factor = 1

while True:
    # Scan for a robot
    scan_results = robot.scan(biggest_arc / (2**factor))
    # scan_results is now an array of multiple robots.

    if scan_results:
        # If we found them, record their distance and accuracy (will be either
        # -1, -.5, 0, .5, 1; the angle is this times your scan width)
        dist, accuracy = scan_results[0]['distance'], scan_results[0]['bearing']
        # Steer our turret to face our target (this is instantaneous).
        robot.turret_rotation += (accuracy * biggest_arc / (2**factor))
        factor += 1
    else:
        # We couldn't find them; our arc is too narrow. Back off a bit and
        # make it wider.
        factor -= 2

    if factor <= 0:
        # If we're as coarse as we can get, just spin around a little.
        factor = 0
        robot.turret_rotation += 180

