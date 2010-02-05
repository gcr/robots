#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource, ErrorResource
from twisted.internet import task, reactor
import utils
from robots import misc

class RoboResource(resource.Resource):
    """
    This class represents a robot and a connection with a client.
    It's responsible for assigning client callbacks and talking to the game
    logic. It will set up callbacks so that the client gets a result back
    when the game logic decides to send one.
    """
    isLeaf = True
    def __init__(self, match, robot_id):
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
            # must do three things:
            #   add a robot to game.robots
            #   when the match starts, return game.robots[robot_id]
            #   if the robot drops the connection and there are no other robots
            #      waiting, game.robots[robot_id] to none.
            queue_defr = self.game.set_future(0, self.robot_id)
            # note: in the case of multiple connections to the server, this
            # would have run the last one's errback and cleared the last one's
            # robot from game.robots. so as long as we create and assign the
            # robot below this line, we should be good.
            # now, when this action gets carried out, send the connection
            # information to the robot.
            def p(s):
                print s
            queue_defr.addCallback(lambda _: p("Robot %s will join!" %
                self.robot_id))
            queue_defr.addErrback(lambda result:
                    ErrorResource(result.value[0]).render(request))
            # if the robot ever loses its http connection, then we'll simply
            # remove it, BUT ONLY if the match hasn't started.
            reqdefr = request.notifyFinish()
            def remove_robot(result):
                if not self.match.started:
                    self.game.robots[self.robot_id] = None
                print "Robot disconnected."
                print self.game.robots
            reqdefr.addErrback(remove_robot)
            robot = self.game.create_robot(self.robot_id, request.args)
            print "Robot %s connected." % self.robot_id
            print self.game.robots
            return server.NOT_DONE_YET

        # match started
        pass
        return server.NOT_DONE_YET
