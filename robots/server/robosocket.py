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
    def __init__(self, match, robot_id):
        print "robosocket: %s" % robot_id
        self.match = match
        self.game = self.match.game
        self.robot_id = robot_id

    def render_GET(self, request):
        if not self.match.started:
            print request.args
            assert 'connect' in request.args, ("Match hasn't started yet! "
                    "You must connect first!")
            return server.NOT_DONE_YET

        # match started
        pass
        return server.NOT_DONE_YET
