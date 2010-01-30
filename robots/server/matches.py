#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource
from twisted.internet import task, reactor
import utils
import robosocket
from robots import gamelogic

class Match(resource.Resource):
    """
    A robot match! Muahaha!
    This Match class handles robot registration and coordinating multiple
    robots. It simply binds unique IDs to "slots" that map to a Robosocket which
    handles what to do with the client.
    """
    GAME_LOGIC = gamelogic.ATRobotsInspiredGame

    def __init__(self, speed=5.0, private=False, start_timeout=0,
            lockstep=False):
        """
        Private: whether the match will show up on public listings (still will
            always grant a slot if someone knows the s33krit match URL)
        Speed: how long to wait for slow robot clients to do something before
            skipping their turn
        Start_timeout: how long do we wait until we start the match
        lockstep: If set, this match will not skip a turn even if all the
            clients are ready to move. If unset (default), the match will
            continue to the next turn if all clients are waiting for something.
        """
        resource.Resource.__init__(self)
        self.game = self.__class__.GAME_LOGIC()
        self.timer = None

        # TODO: don't do this. this is a stupid system and I am a silly boy.
        # Instead, store robots just in the game logic. Then, allow RoboSocket
        # to bind callbacks to request.notifyFinish(). When robots connect
        # before the match starts, roboSocket will call game.CreateNewRobot(id,
        # attributes) which will return a robot and add it to the dictionary in
        # the game logic. The request's errback looks like: if not
        # match.started: game.remove_robot(returned_robot) so their robot will
        # disappear if they do before the match.

        # now, the problem of notifying people when the match starts? we'll have
        # a function here, notifyStart, that when called, makes a Deferred and
        # adds it to the list that'll be set off when start() is called. Just
        # like how http.Request handles notifyStart(). This Deferred's callback
        # will tell the client their connection information. be sure to set
        # match.started to True before calling this off, or the other callback I
        # mentioned will see that their HTTP request died and remove their
        # robot.

        # yeah, that seems a little better.
        # i should keep this comment for documentation's sake.
        self.notify_start = []

        self.started = False
        self.speed = speed
        self.private = private
        self.lockstep = lockstep
        if start_timeout:
            self.start_timer = reactor.callLater(start_timeout, self.start)


    def start(self):
         # Start the match, but don't do a tick right away. loop through
         # our notification list, firing off callbacks everywhichway to tell
         # people "GUYS HEY GUYS WE'RE STARTING NAO"
         # (RoboSocket will handle unbinding them if not), then clear game.slots
         # by removing objects that had None
         # If there are no robots connected, then remove
         # ourselves from the match list.
         # TODO: FIX IT, we don't do that; instead, we fire off the callbacks
         # in our notified robots list.
         self.started = True
         for robot_id in self.game.robots:
             if robot_id:
                 JsonResource("mock start").render(self.game.robots[robot_id])
         self.timer = task.LoopingCall(self.game.pump)
         self.timer.start(self.speed, now=False)


    def request_slot(self, request):
        """
        Make a new slot for a robot to connect to and return it.
        """
        assert not self.started, "This match is started. No more robots!"
        n = "robot_" + utils.random_string(15)
        if n in self.game.robots:
            # try harder!
            return request_slot(self, request)
        self.game.robots[n] = None
        print "New slot: %s" % n
        return n


    def getChild(self, robot_id, request):
        """
        Returns the robot that the client wanted
        """
        if robot_id.lower() == "start":
            assert not self.started, "Can't start a started match!"
            self.start()
            return False
        if robot_id.lower() == "register":
            assert not self.started, "Can't join a started match!"
            slot = self.request_slot(request)
            return JsonResource(slot)
        # oh, they want an actual robot? aw. oh well.
        assert robot_id in self.game.robots, "Your robot doesn't exist!"
        # the RoboResource will handle and this request. twisted.web is happy
        # to call its render_GET method.
        return robosocket.RoboResource(self, robot_id)



#################################
class Matches(resource.Resource):
    """
    Represents a list of matches going on in this server.

    You can browse the matches by heading to http://server_url/matches and can
    register your own by going to http://server_url/matches/register.
    """
    MIN_MATCH_SPEED = 0.5               # fastest match allowed


    def __init__(self):
        resource.Resource.__init__(self)
        self.matches = {}


    def render_GET(self, request):
        """
        Returns the public matches
        """
        return JsonResource(self.matches).render(request)


    def register_new(self, **kwargs):
        """
        Registers a new match.
        """
        n = utils.random_string(8)
        if n in self.matches:
            return self.register_new(**kwargs)
        self.matches[n] = Match(**kwargs)
        print "New match registered: %s" % n
        return n


    def getChild(self, path, request):
        """
        Either:
            - Registers and starts a new match
            - Gets a match if there was one
            - Gets the current matches
        """
        if path.lower() == "register":
            # Client wants a new match? Try to make one!
            args = {}
            if 'private' in request.args:
                args['private'] = True
            if 'speed' in request.args:
                assert (float(request.args['speed'][0]) <
                    self.__class__.MIN_MATCH_SPEED), "Match can't be that fast!"
                args['speed'] = float(request.args['speed'][0])
            if 'start_timeout' in request.args:
                args['start_timeout'] = float(request.args['start_timeout'][0])
            if 'lockstep' in request.args:
                args['lockstep'] = True
            # success!
            return JsonResource(self.register_new(**args))

        elif path in self.matches:
            # Client wants a specific match
            return self.matches[path]

        else:
            raise KeyError, "This match does not exist!"

