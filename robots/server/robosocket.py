#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource, ErrorResource
from twisted.internet import task, reactor
import utils

class RoboResource(resource.Resource):
    """
    This class represents a robot and a connection with a client.
    It's responsible for assigning client callbacks and talking to the game
    logic. It will set up callbacks so that the client gets a result back
    when the game logic decides to send one.
    """
    isLeaf = True
    def __init__(self, match, robot_id):
        print "robosocket: %s" % robot_id
        self.match = match
        self.game = self.match.game
        self.robot_id = robot_id


    @property
    def robot(self, request):
        " Which robot are we bound to? "
        try:
            return self.game.robots[self.robot_id]
        except KeyError:
            return None


    def render_GET(self, request):
        " What to do when they connect to our URL "
        if not self.match.started:
            assert 'connect' in request.args, ("Match hasn't started yet! "
                    "You must connect first!")
            d = request.notifyFinish()
            def connect_lost(reason, robot_id):
                print "Connection %s lost" % robot_id
                if not self.match.started:
                    self.game.robots[robot_id] = None
                    print self.game.robots
            d.addErrback(connect_lost, self.robot_id)
            print "Robot connected."
            return server.NOT_DONE_YET

        # match started
        pass
        return server.NOT_DONE_YET
