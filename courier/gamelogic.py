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
        self.future = {}
        self.field = field.Field()
        # maps unique IDs to robots
        self.robots = {}
        # callbacks
        self.on_new_robot_cb = None
        self.on_disconnect_robot_cb = None
        self.on_remove_slot_cb = None

    def __json__(self):
        return {'gametime': self.time,
                'robots': [self.robots[r] for r in self.robots]}

    def start(self):
        assert self.time == 0, "This game is in-progress."
        for r in self.robots:
            self.field.add(self.robots[r])

    def pump(self):
        """
        Go through the history. Carry out the action on the robot.
        """
        if self.time in self.future:
            rids = self.future[self.time].keys()
            random.shuffle(rids)
            for rid in rids:
                # Fire off the actions for each robot in self.future
                # in a random order
                self.future[self.time][rid].callback(self.time)
            del self.future[self.time]
        self.field.pump()
        self.time +=1

    # callbacks -- passed straight away onto our field
    def on_pump(self, f):
        self.field.on_pump(f)

    def on_hit(self, f):
        self.field.on_hit(f)

    def on_splash(self, f):
        self.field.on_splash(f)

    def on_new_robot(self, f):
        " runs f when a new robot is created."
        self.on_new_robot_cb = f

    def on_disconnect_robot(self, f):
        " runs f when a robot is disconnected."
        self.on_disconnect_robot_cb = f

    def on_remove_slot(self, f):
        """
        runs f when a robot is removed from the game. the client should just
        take it out of its robot list.
        """
        self.on_remove_slot_cb = f

    def remove_slot(self, robot_id):
        """
        Removes the slot with robot_id from the server.
        """
        assert robot_id in self.robots, "Can't remove a slot that wasn't there"
        if self.robots[robot_id]:
            self.disconnect_robot(robot_id)
        if self.on_remove_slot_cb:
            self.on_remove_slot_cb()
        del self.robots[robot_id]

    def disconnect_robot(self, robot_id):
        """
        Disconnects the robot from the game.
        """
        if self.on_disconnect_robot_cb:
            self.on_disconnect_robot_cb(self.robots[robot_id])
        self.robots[robot_id] = None

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
        if self.on_new_robot_cb:
            self.on_new_robot_cb(rob)
        return rob

    def set_future(self, time, robot_id):
        """
        Asks something to be executed at a certain time in the game's future.
        This returns a Deferred. Attach callbacks if you like; they'll get
        executed once your robot carries out its task.
        Will check to ensure that there aren't any actions from this robot
        already.
        """
        # Make sure there aren't any other robots here. If there are, then fire
        # off their Deferred errbacks and overwrite them.
        for time in self.future:
            if robot_id in self.future[time]:
                print ("Uh oh! Duplicate connections from %s, canceling the "
                       "first") % robot_id
                self.future[time][robot_id].errback(CheatingException("Canceling action"))
        # Now assign our Deferred. =3
        d = Deferred()
        if time not in self.future:
            # no history for this time yet
            self.future[time] = {}
        self.future[time][robot_id] = d
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
