#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Patrols the edges of the map going clockwise. Just drives around in circles,
taking pains not to hit a wall.

When we see a wall, turn right a little.
"""

from courier import RoboLink

robot = RoboLink.connect(name="Patroller", scanner=2, engine=5)
#                                          ^^^ by default, we get a 5-quality
#                            scanner and a 2-quality engine. well, we want to
#                            move faster, so we'll soup up our engine instead.


# Should probably be handled by RoboLink.connect, but whatever.
if not robot:
    print "Error connecting"
    exit(1)


# The below will be changed to 'while not robot.dead:' just as soon as I
# implement that.
while True:

    # Full speed ahead! Doing this every tic just in case we hit a wall or stop
    # or something. Setting the throttle doesn't take very long.
    robot.throttle = 100

    if robot.scan_wall() is not None:
        # If we see a wall, turn right ten degrees.
        robot.turn(10)

