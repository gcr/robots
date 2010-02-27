#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource, ErrorResource
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

            # written like this.
            # {
            #   'request': (
            #               ('game_logic_string', 'extra_arguments_to_verify'),
            #               ...
            #              )
            # e.g. http://.../robot_xxx?request=t&extra_arguments=25
            ACTIONS = {
                'turn': [['turn', 'amount']],
                'throttle': [['set_throttle', 'amount'],
                             ['get_throttle']],
                'location': [['location']],
                'rotation': [['rotation']],
                'scan_wall': [['scan_wall']],
                'turret_rotate':  [['set_turret_rotate', 'angle'],
                                   ['get_turret_rotate']],
                'scan_robots': [['scan_robots', 'angle']],
            }
            for action in ACTIONS:
                if action in request.args:
                    for overloaded_function in ACTIONS[action]:
                        arguments = overloaded_function[1:]
                        action_str = overloaded_function[0]
                        kwargs = {}
                        # which overloaded 'action' to call?
                        if all([arg in request.args for arg in arguments]):
                            # verify the rest of the arguments
                            for arg in arguments:
                                kwargs[arg] = utils.verify_float(request.args, arg)
                            # Ask the game logic to handle this action for us.
                            # When we're done, render the JSON results.
                            game_action = self.game.robot_action(self.robot_id,
                                    action_str, **kwargs)
                            def send_result(result=None):
                                JsonResource(result).render(request)
                            game_action.addCallback(send_result)
                            def on_error(result):
                                ErrorResource(result.value[0]).render(request)
                            game_action.addErrback(on_error)
                            return server.NOT_DONE_YET

        raise KeyError, "Invalid Command"
        return server.NOT_DONE_YET

