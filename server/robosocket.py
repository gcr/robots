#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource, ErrorResource
from math import pi
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
        self.match = match
        self.game = self.match.game
        self.robot_id = robot_id

    @property
    def robot(self):
        " Which robot are we bound to? "
        try:
            return self.game.robots[self.robot_id]
        except KeyError:
            return None

    def connect_new_robot(self, request):
        """
        Connect a robot when the user calls their ?connect URL before the match
        starts.
        """
        # must do three things:
        #   add a robot to game.robots
        #   when the match starts, return game.robots[robot_id]
        #   if the robot drops the connection and there are no other robots
        #      waiting, game.robots[robot_id] to none.
        queue_defr = self.game.set_future(0, self.robot_id)
        # this will delete the robot (by running the existing http request
        # callback) if it already exists, so no need to worry about making a
        # new one that might get deleted.
        def when_match_starts(_):
            print "Robot %s will join!" % self.robot_id
            JsonResource(self.game.robots[self.robot_id]).render(request)
        queue_defr.addCallback(when_match_starts)
        def when_duplicate_connection(result):
            # if another robot with our robot ID joins
            self.game.disconnect_robot(self.robot_id)
            ErrorResource(result.value[0]).render(request)
        queue_defr.addErrback(when_duplicate_connection)
        # if the robot ever loses its http connection, then we'll simply
        # remove it, BUT ONLY if the match hasn't started.
        reqdefr = request.notifyFinish()
        def connection_lost(result):
            if not self.match.started:
                self.game.disconnect_robot(self.robot_id)
            print "Robot disconnected."
        reqdefr.addErrback(connection_lost)

        robot = self.game.create_robot(self.robot_id, request.args)
        print "Robot %s connected." % self.robot_id
        print self.game.robots
        return server.NOT_DONE_YET

    def dispatch_game_action(self, req, action, **kwargs):
        # Ask the game logic to handle this action for us.
        # When we're done, render the JSON results.
        game_action = self.game.robot_action(self.robot_id, action, **kwargs)
        def send_result(result=None):
            JsonResource(result).render(req)
        game_action.addCallback(send_result)
        def on_error(result):
            ErrorResource(result.value[0]).render(req)
        game_action.addErrback(on_error)
        return server.NOT_DONE_YET

    def render_GET(self, request):
        " What to do when they connect to our URL "
        if 'info' in request.args:
            JsonResource(self.robot).render(request)
            return server.NOT_DONE_YET
        if not self.match.started:
            assert 'connect' in request.args, ("Match hasn't started yet! "
                    "You must connect first!")
            return self.connect_new_robot(request)
        else:
            # match started
            if 'connect' in request.args:
                # reunite them with their existing robot.
                JsonResource(self.robot).render(request)
                return server.NOT_DONE_YET
            elif 'steer' in request.args:
                amount = utils.verify_float(request.args, 'amount')
                return self.dispatch_game_action(request, 'steer', amount=amount)
            elif 'throttle' in request.args:
                amount = utils.verify_float(request.args, 'amount')
                return self.dispatch_game_action(request, 'throttle', amount=amount)
            elif 'location' in request.args:
                return self.dispatch_game_action(request, 'location')
            elif 'rotation' in request.args:
                return self.dispatch_game_action(request, 'rotation')
            elif 'scan_wall' in request.args:
                return self.dispatch_game_action(request, 'scan_wall')
            elif 'rotate_turret' in request.args:
                angle = utils.verify_float(request.args, 'angle')
                return self.dispatch_game_action(request, 'rotate_turret',
                        angle=angle)
            elif 'scan' in request.args:
                angle = utils.verify_float(request.args, 'angle')
                assert -pi/2. < angle < pi/2., "Angle must be between -pi/2 and pi/2"
                self.robot.start_scan(angle)
                # todo: put that in the game logic
                return self.dispatch_game_action(request, 'scan')

        raise KeyError, "Invalid Command"
        return server.NOT_DONE_YET

