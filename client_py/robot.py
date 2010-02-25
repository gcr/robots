#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urlparse, urlsplit
import urllib2
import urllib
import socket
import json

class Server(object):
    """
    This represents a fairly low-level link with a server.
    With the power of this class, you can talk directly to the server, fetch the
    results of a web page, etc. You'll likely want to use the higher level
    RoboLink API instead unless you're doing something really sneaky.
    """
    # constants - URL builders
    MATCH = "matches"

    def __init__(self, url="http://localhost:8080"):
        """
        Pass in a server URL, get a server object out. This won't work if your
        server is hosted as a subdirectory e.g.
        http://foobar:8080/robot_battles/
        """
        u = urlsplit(url)
        self.host = "%s://%s" % (u[0], u[1])

    # useful functions
    @classmethod
    def url_concat(cls, *parts):
        """
        splice a URL together; just concatenate it really
        """
        parts = list(parts)
        # remove trailing slash
        for i, path in enumerate(parts):
            if path.strip().endswith('/'):
                parts[i] = path.strip()[:-1]
        return '/'.join(parts)

    @classmethod
    def _fetch_raw(cls, url, kwargs=None):
        """
        Fetch something from a web page, optionally encoding keyword arguments
        """
        if kwargs:
            url = url + "?" + urllib.urlencode(kwargs)
        return urllib2.urlopen(url).read()

    @classmethod
    def _fetch(cls, url, kwargs):
        """
        Fetch a JSON object from a web page, encoding keyword parameters
        """
        result = json.loads(cls._fetch_raw(url, kwargs))
        # a 'exception' is when the server signals the client that something
        # went wrong
        if isinstance(result, dict) and 'exception' in result:
            raise RobotException(result['exception'])
        return result

    @classmethod
    def _fetch_persist(cls, url, kwargs=None):
        """
        Fetch a JSON object from a web page, retrying in case of timeouts
        """
        try:
            return cls._fetch(url, kwargs)
        except urllib2.URLError, e:
            if isinstance(e.reason, socket.timeout):
                return cls._fetch_persist(url, kwargs)
            else:
                raise e

    def register_match(self, **kwargs):
        """
        Register a match, then return a URL of that match.
        """
        kwargs['register'] = 't'
        result = self._fetch(self.url_concat(self.host, self.MATCH), kwargs)
        return result

class Robot(object):
    """
    A robot with things that you can do.
    """
    def __init__(self, url, data):
        # see: courier/robot.py Robot.__json__
        self.url = url
        self.name = data['name']
        self.armor = data['armor']
        self.heat = data['heat']

    def __str__(self):
        return "<Robot '%s' (%s armor)>" % (self.name, self.armor)

    def steer(self, amount):
        """
        Steer ourselves by amount (relative)
        """
        return Server._fetch(self.url, {'steer': 't', 'amount': amount})

class RoboLink(object):
    """
    Handles connecting to a match and such.
    """
    @classmethod
    def ask_for_url(cls):
        """
        Asks the user for a match URL.
        """
        print "Please paste a match URL here."
        return raw_input("> ")

    @classmethod
    def connect(cls, url=None, **kwargs):
        """
        Returns a robot bound to a slot in a match. This call will likely
        block until the match starts.
        """
        if not url:
            url = cls.ask_for_url()
        # if they already have a url like http://server/matches/aoa/robot_bbb,
        # then skip the step of registering stuff.
        path = urlparse(url)[2][1:]
        #                       ^ urlparse returns a path with a leading slash
        if path.startswith(Server.MATCH):
            path = path[len(Server.MATCH)+1:]
            #                            ^ must account for trailing slash
        if len(path.split('/')) < 2:
            print "Registering with match..."
            slot_url = Server.url_concat(url, Server._fetch(url, {'register': 't'}))
            print "Here is your robot's slot:\n    %s    \n" % slot_url
            print ("If your robot crashes, use that URL next time "
                    "you connect to rejoin the match.\n")
        else:
            slot_url = url
        kwargs['connect'] = 't'
        print "Waiting for game to start..."
        return Robot(slot_url, Server._fetch_persist(slot_url, kwargs))

class RobotException(Exception):
    pass
