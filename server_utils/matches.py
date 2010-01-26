#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource
from twisted.internet import task
import string
import random

class Match(resource.Resource):
    """
    A robot match! Muahaha!

    Has:
        - methods to start and stop
        - a "game" complete with rules
        - a hash of robots

    All robots will call their signal_ready() method.
    """
    def __init__(self):
        resource.Resource.__init__(self)
        self.http_requests_waiting = []
        self.timer = task.LoopingCall(self.pump)
        #self.speed = 5.0 # seconds
        self.speed = 1.0 # seconds
        self.start()

    def start(self):
        # Start the match, but don't do a tick right away.
        self.timer.start(self.speed, now=False)

    def pause(self):
        self.timer.stop(self.speed)

    def pump(self):
        """
        Pump the game. Then, loop through all outstanding http requests.
        (Actually, the Game should do this; but it's fine for just a test.
        """
        print "pump'd"
        print self.http_requests_waiting
        for request in self.http_requests_waiting:
            JsonResource({'state': 'success'}).render(request)
        self.http_requests_waiting = []

    def connection_lost(self, reason, request):
        """
        called when we lose the connection to a client
        """
        print "Connection lost"
        self.http_requests_waiting.remove(request)

    def render_GET(self, request):
        self.http_requests_waiting.append(request)
        # vv this is a 'deferred'
        defr = request.notifyFinish()
        defr.addErrback(self.connection_lost, request)
        return server.NOT_DONE_YET


class Matches(resource.Resource):
    """
    Represents a list of matches going on in this server.

    You can browse the matches by heading to http://server_url/matches and can
    register your own by going to http://server_url/matches/register.

    """
    def __init__(self):
        resource.Resource.__init__(self)
        self.matches = {}

    def new_random_match_string(self):
        """
        Returns a random string of digits guaranteed not to be in self.matches
        """
        x = ''.join(random.choice(string.letters + string.digits) for _ in
                xrange(15))
        return x if x not in self.matches else self.new_random_match()

    def render_GET(self, request):
        """
        Returns the public matches
        """
        return JsonResource(self.matches).render(request)

    def register_new(self, request):
        """
        Registers a new match.
        """
        n = self.new_random_match_string()
        self.matches[n] = Match()
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
            return JsonResource(self.register_new(request))
        elif path in self.matches:
            return self.matches[path]
        else:
            return JsonResource({'error': 'No match!'})

