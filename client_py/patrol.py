#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Patrols the edges of the map. going clockwise. Demonstrates overall use of the
framework along with basic optimization techniques.

This robot's movement pattern looks like:
  0,1024
     +--------------------------------------+
     |                                      |
     |    .----->                 -----.    |
     |   |                              |   |
     |   |                              |   |
     |                                 \/   |
     |                                      |
     |                                      |
     |                                      |
     |                                      |
     |   /\                                 |
     |   |                              |   |
     |   |                              |   |
     |    '----                 <------'    |
     |                                      |
     +--------------------------------------+ 1024,0
  0,0
"""

from courier import RoboLink
import math

robot = RoboLink.connect(name="Patroller", scanner=2, engine=5)
#                                          ^^^ by default, we get a 5-quality
#                            scanner and a 2-quality engine. well, we want to
#                            move faster, so we'll soup up our engine instead.


# Should probably be handled by RoboLink.connect, but whatever.
if not robot:
    print "Error connecting"
    exit(1)


# First, we want to see where we're headed. We *could* use robot.steer_abs()
# every tic, but that takes a compass reading every time we use it; this lowers
# our robot's reaction time if we're just sitting around waiting for compass
# readings. Instead, we'll store our bearing and save it for later.
bearing = robot.compass()
#                 ^^^
# these are actually radians, but we'll convert.
#            | 0°
#            |
#            |
# -90° ------+------- 90°
#            |
#            |
#            | 180°

# The below will be changed to 'while not robot.dead:' just as soon as I
# implement that.
while True:

    # Expensive: GPS queries take time! This call will block for 3 turns. We
    # can't cache this because we don't know exactly where we're at. Feel free
    # to build a caching framework on top of these basic building blocks though.
    # Maybe you can predict your precision rather than asking for it every
    # frame. Not a bad idea, but it won't be accurate, especially if you hit a
    # wall or another robot.
    x, y = robot.locate()

    # Full speed ahead! Doing this every tic just in case we hit a wall or stop
    # or something. Setting the throttle doesn't take very long.
    robot.throttle(100)

    if x >= 700 and y >= 300:
        # Right side
        #robot.steer_abs(math.radians(180))
        # ^ expensive! That must take a compass reading every turn.
        if bearing != math.radians(180):
            # We need to switch directions.
            robot.steer(math.radians(180) - bearing)
            bearing = math.radians(180)
    elif y <= 300 and x >= 300:
        # Bottom
        if bearing != math.radians(-90):
            robot.steer(math.radians(-90) - bearing)
            bearing = math.radians(-90)
    elif x <= 300 and y <= 700:
        # Left
        if bearing != math.radians(0):
            robot.steer(math.radians(0) - bearing)
            bearing = math.radians(0)
    elif x <= 700 and y >= 700:
        # Top
        if bearing != math.radians(90):
            robot.steer(math.radians(90) - bearing)
            bearing = math.radians(90)

# Here's what we're doing.
# when the robot reaches one of these areas on our field, it will switch
# directions thusly:
#     +---------------------+
#     |   GO RIGHT      | G |
#     |-----------------| O |
#     | G  |            |   |
#     | O  |            | D |
#     |    |            | O |
#     | U  |            | W |
#     | P  |            | N |
#     |    |----------------|
#     |    |  GO LEFT       |
#     +---------------------+

