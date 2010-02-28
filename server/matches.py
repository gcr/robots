#!/usr/bin/env python
# -*- coding: utf-8 -*-

import datetime
from twisted.web import resource
from json_resource import JsonResource
from twisted.internet import task, reactor
import utils
import robosocket
import jinja_resource
import history
from courier import gamelogic

class Match(resource.Resource):
    """
    A robot match! Muahaha!
    This Match class handles robot registration and coordinating multiple
    robots. It simply binds unique IDs to "slots" that map to a Robosocket which
    handles what to do with the client.
    """
    GAME_LOGIC = gamelogic.ATRobotsInspiredGame
    MIN_MATCH_SPEED = 0.01               # fastest match allowed

    def __init__(self, matchlist, speed=0.2, public=True, start_timeout=0,
            lockstep=False):
        """
        public: whether the match will show up on public listings (still will
            always grant a slot if someone knows the s33krit match URL)
        Speed: how long to wait for slow robot clients to do something before
            skipping their turn
        Start_timeout: how long do we wait until we start the match
        lockstep: If set, this match will not skip a turn even if all the
            clients are ready to move. If unset (default), the match will
            continue to the next turn if all clients are waiting for something.
        """
        resource.Resource.__init__(self)
        self.matchlist = matchlist
        self.game = self.GAME_LOGIC()
        self.timer = None
        self.started = False
        self.speed = speed
        self.public = public
        self.lockstep = lockstep
        self.init_time = datetime.datetime.now()
        self.history = history.History()
        # Anyone with this auth code has permission to start the match.
        self.auth_code = utils.random_string(15)
        self.set_up_callbacks()
        if start_timeout:
            self.start_timer = reactor.callLater(start_timeout, self.start)

    def set_up_callbacks(self):
        """
        Sets up the callbacks to be run whenever something interesting happens.
        """
        def on_pump(field):
            self.history.add({"field": field})
        self.game.on_pump(on_pump)
        def on_hit(obj, location):
            self.history.add({"hit": {'obj': obj, 'location': location}})
        self.game.on_hit(on_hit)
        def on_splash(obj, location, damage):
            self.history.add({"splash_damage":
                {"objects": obj, "location": location, "damage": damage}})
        self.game.on_splash(on_splash)
        # when a robot disappears
        def on_remove_slot():
            self.history.add({"remove_slot": True})
        self.game.on_remove_slot(on_remove_slot)
        # when a robot 'disconnects' before a match starts; the client should
        # gray it out or something.
        def on_disconnect_robot(robot):
            self.history.add({"disconnect_robot": robot})
        self.game.on_disconnect_robot(on_disconnect_robot)
        def on_new_robot(robot):
            self.history.add({"connected_robot": robot})
        self.game.on_new_robot(on_new_robot)

    def start(self, auth_code):
         # Start the match. Clear game.robots by removing objects that had
         # None, then set the timer. If there are no robots connected, then
         # remove ourselves from the match list.
         assert auth_code == self.auth_code, "Authentication code is incorrect."
         self.started = True
         empty_robots = [rid for rid in self.game.robots if not self.game.robots[rid]]
         for rid in empty_robots:
             self.game.remove_slot(rid)
         if len(self.game.robots) == 0:
             self.matchlist.remove(self)
             return False
         self.game.start()
         self.history.add({"match_started": True})
         self.timer = task.LoopingCall(self.pump)
         self.timer.start(self.speed, now=True)

    def pump(self):
        """
        Go through one iteration of the game.
        """
        self.game.pump()
        return True

    def request_slot(self, request):
        """
        Make a new slot for a robot to connect to and return it.
        """
        assert not self.started, "This match is started. No more robots!"
        n = "robot_" + utils.random_string(15)
        if n in self.game.robots:
            # try harder!
            return self.request_slot(request)
        self.game.robots[n] = None
        self.history.add({"new_slot": None})
        print "New slot: %s" % n
        return n

    def getChild(self, robot_id, request):
        """
        twisted: returns the robot that the client wanted
        """
        if robot_id == '':
            return self
        # oh, they want an actual robot? aw. oh well.
        assert robot_id in self.game.robots, "Your robot doesn't exist!"
        # the RoboResource will handle and this request. twisted.web is happy
        # to call its render_GET method.
        return robosocket.RoboResource(self, robot_id)

    def render_GET(self, request):
        if "start" in request.args:
            assert not self.started, "Can't start a started match!"
            assert 'auth_code' in request.args, "Need an authentication code to start this match."
            self.start(request.args['auth_code'][0])
            return JsonResource("").render(request)
        elif "register" in request.args:
            assert not self.started, "Can't join a started match!"
            slot = self.request_slot(request)
            return JsonResource(slot).render(request)
        elif 'history' in request.args:
            return history.HistoryResource(self.history).render(request)
        elif 'info' in request.args:
            client_info = self.game.__json__()
            client_info['init_time'] = str(self.init_time)
            client_info['history'] = self.history.time
            client_info['started'] = self.started
            client_info['speed'] = self.speed
            client_info['public'] = self.public
            return JsonResource(client_info).render(request)
        # redirect to the browser
        return jinja_resource.Match(match_id=self.matchlist.match_id_for(self)).render(request)



class Matches(resource.Resource):
    """
    Represents a list of matches going on in this server.

    You can browse the matches by heading to http://server_url/matches and can
    register your own by going to http://server_url/matches/register.
    """
    MATCH_TYPE = Match

    def __init__(self):
        resource.Resource.__init__(self)
        self.matches = {}
        self.history = history.History()

    def render_GET(self, request):
        """
        Returns the public matches
        """
        mlist = [n for n in self.matches if self.matches[n].public]
        if 'list' in request.args:
            return JsonResource({
                'history': self.history.time, 'matches': mlist
                }).render(request)
        elif 'history' in request.args:
            return history.HistoryResource(self.history).render(request)
        elif 'register' in request.args:
            # Client wants a new match? Try to make one!
            args = {}
            if 'public' in request.args:
                args['public'] = utils.is_trueish(request.args['public'][0]);
            if 'speed' in request.args:
                assert (float(request.args['speed'][0]) >=
                    self.MATCH_TYPE.MIN_MATCH_SPEED), "Match can't be that fast!"
                args['speed'] = float(request.args['speed'][0])
            if 'start_timeout' in request.args:
                args['start_timeout'] = float(request.args['start_timeout'][0])
            if 'lockstep' in request.args:
                args['lockstep'] = True
            m, auth_code = self.register_new(**args)
            return JsonResource({'match': m, 'auth_code': auth_code}).render(request)
        # browser visiting
        return jinja_resource.MatchList(matches=mlist).render(request)

    def match_id_for(self, match):
        """
        finds a match ID for a given match
        """
        return [k for k in self.matches if self.matches[k] == match][0]

    def remove(self, match):
        """
        Removes a given match from the match list.
        """
        to_remove = [k for k in self.matches if self.matches[k] == match]
        for k in to_remove:
            print "Removing match %s" % k
            del self.matches[k]
        # append to our history for long-polling clients
        if match.public:
            self.history.add({'removed': to_remove})

    def register_new(self, **kwargs):
        """
        Registers a new match. Returns a 2-tuple: (match, auth code)
        """
        n = utils.random_string(8)
        if n in self.matches:
            return self.register_new(**kwargs)
        self.matches[n] = self.MATCH_TYPE(self, **kwargs)
        print "New match registered: %s" % n
        # append to history for long-polling clients
        if self.matches[n].public:
            self.history.add({'added': n})
        return (n, self.matches[n].auth_code)

    def getChild(self, path, request):
        """
        Which match does the user want?
        """
        if path == '':
            return self
        elif path in self.matches:
            # Client wants a specific match
            return self.matches[path]
        else:
            raise KeyError, "This match does not exist!"

