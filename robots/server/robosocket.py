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
            # add the robot
            # must do three things:
            #   add a robot to game.robots
            #   when the match starts, return game.robots[robot_id]
            #   if the robot drops the connection and there are no other robots
            #      waiting, game.robots[robot_id] to none.
            queue_defr = self.game.set_history(0, self.robot_id)
            # now, when this action gets carried out, send the connection
            # information to the robot.
            def p(s):
                print s
            queue_defr.addCallback(lambda _: p("Robot %s will join!" %
                self.robot_id))
            queue_defr.addErrback(lambda result:
                    ErrorResource(result.value[0]).render(request))
            # if the robot ever loses its http connection, then we'll simply
            # remove it.
            reqdefr = request.notifyFinish()
            reqdefr.addErrback(lambda result: p("Robot %s disappeared" %
                    self.robot_id))
            print "Robot %s connected." % self.robot_id
            return server.NOT_DONE_YET

        # match started
        pass
        return server.NOT_DONE_YET



#    def create_robot(self, id, attributes):
#        """
#        Create a robot with the given ID and the given attributes, if any.
#        """
#        assert robot_id not in self.robots and not self.robots[robot_id], ("Can't "
#        "create a robot that's already there!")
#        # This would be the place where we impose strange limitations (e.g. no
#        # shields in this match or whatnot)
#        # Not now though.
#        if 'name' not in attributes:
#            attributes['name'] = misc.pick_cool_name()
#        self.robots[robot_id] = robot.Robot(
#                name,
#                self.field,
#                vector.Vector([random.randint(0, self.field.width),
#                               random.randint(0, self.field.height)]),
#                **attributes)
#        return self.robots[robot_id]
