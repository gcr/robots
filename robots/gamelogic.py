#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.internet.defer import Deferred
import robot
import field
import vector
import random
import misc

class Game(object):
    """
    Represents the logic for this game.
    """
    def __init__(self):
        """
        create a field, history, and robots
        """
        self.time = 0
        # maps time to a list of actions
        # {25: {1: defr, 2: defr, 3: defr}} means three actions will be carried out
        # should be executed at time=25
        self.history = {}
        self.field = field.Field()
        # maps unique IDs to robots
        self.robots = {}


    def pump(self):
        """
        Go through the history. Carry out the action on the robot.
        """
        pass


    def remove_robot(self, robot_id):
        """
        Removes the robot with robot_id from the server
        """
        assert robot_id in self.robots, "Can't remove a robot that wasn't there"
        del self.robots[robot_id]


    def create_robot(self, id, attributes):
        """
        Create a robot with the given ID and the given attributes, if any.
        """
        # This would be the place where we impose strange limitations (e.g. no
        # shields in this match or whatnot)
        # Not now though.
        args = {}
        if 'name' not in attributes:
            name = misc.pick_cool_name()
        else:
            name = attributes['name'][0]
        for attr in ['scanner', 'weapon', 'armor', 'engine', 'heatsink', 'mines', 'shield']:
            if attr in attributes:
                args[attr] = int(attributes[attr][0])
        rob = robot.Robot(
                name,
                self.field,
                vector.Vector([random.randint(0, self.field.width),
                               random.randint(0, self.field.height)]),
                **args)
        self.robots[id] = rob
        return rob


    def set_history(self, time, robot_id):
        """
        Asks something to be executed at a certain time in the history.
        This returns a Deferred. Attach callbacks if you like; they'll get
        executed once your robot carries out its task.
        Will check to ensure that there aren't any actions from this robot
        already.
        """
        # Make sure there aren't any other robots here. If there are, then fire
        # off their Deferred errbacks and overwrite them.
        for time in self.history:
            if robot_id in self.history[time]:
                print ("Uh oh! Duplicate connections from %s, canceling the "
                       "first") % robot_id
                self.history[time][robot_id].errback(CheatingException("Canceling action"))
        # Now assign our Deferred. =3
        d = Deferred()
        if time not in self.history:
            # no history for this time yet
            self.history[time] = {}
        self.history[time][robot_id] = d
        return d


    def robot_action(self, robot_id, action_str, **kwargs):
        """
        This gets a Deferred from set_history. When called, that Deferred will
        do an action to the robot. This function will then return that Deferred
        to you, so you can do
        defr = game.robot_action('foo', 'scan', size=23)
        defr.addCallback(lambda result: request.send(result))
        (keep in mind that deferreds are chained)
        """
        if self.time != 0:
            assert robot_id in self.robots and self.robots[robot_id] ("This robot "
        "doesn't exist!")
        pass


    @property
    def finished(self):
        """
        Is the game finished?
        """
        pass



class ATRobotsInspiredGame(Game):
    pass



class CheatingException(Exception):
    pass
