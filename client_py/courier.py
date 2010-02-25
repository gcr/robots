#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urlparse, urlunparse
import urllib2
import urllib
import socket
import json

def fetch_raw(url, kwargs=None):
    """
    Fetch something from a web page, optionally encoding keyword arguments
    """
    urlparsed = urlparse(url)
    urlparsed = urlparsed[0:4] + tuple([urllib.urlencode(kwargs)]) + urlparsed[5:]
    return urllib2.urlopen(urlunparse(urlparsed)).read()

def fetch(url, kwargs):
    """
    Fetch a JSON object from a web page, encoding keyword parameters
    """
    result = json.loads(fetch_raw(url, kwargs))
    # a 'exception' is when the server signals the client that something
    # went wrong
    if isinstance(result, dict) and 'exception' in result:
        raise RobotException(result['exception'])
    return result

def fetch_persist(url, kwargs=None):
    """
    Fetch a JSON object from a web page, retrying in case of timeouts
    """
    try:
        return fetch(url, kwargs)
    except urllib2.URLError, e:
        if isinstance(e.reason, socket.timeout):
            return fetch_persist(url, kwargs)
        else:
            raise e

def url_concat(*parts):
    """
    splice a URL together; just concatenate it really
    """
    parts = list(parts)
    # remove trailing slash
    for i, path in enumerate(parts):
        if path.strip().endswith('/'):
            parts[i] = path.strip()[:-1]
    return '/'.join(parts)

class Robot(object):
    """
    A robot held on the client side.
    """
    @classmethod
    def connect(self, slot_url, **kwargs):
        kwargs['connect'] = 't'
        return Robot(slot_url, fetch_persist(slot_url, kwargs))

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
        return fetch(self.url, {'steer': 't', 'amount': amount})

    def steer_abs(self, angle):
        """
        Steer ourselves so that we're facing angle
        """
        self.steer(angle - self.compass())

    def throttle(self, amount):
        """
        Set our throttle to a percentage between -50 and 100.
        """
        return fetch(self.url, {'throttle': 't', 'amount': amount})

    def compass(self):
        return fetch(self.url, {'rotation': 't'})

    def locate(self):
        return fetch(self.url, {'location': 't'})

class Match(object):
    @classmethod
    def register_new(cls, url, **kwargs):
        """
        Register a match, then return a URL of that match.
        """
        kwargs['register'] = 't'
        new_match = fetch(url_concat(url, 'matches'), kwargs)
        m = cls.from_url(url_concat(url, 'matches', new_match['match']))
        m.auth_code = new_match['auth_code']
        return m

    @classmethod
    def from_url(cls, url):
        try:
            data = fetch(url, {'info': 't'})
        except RobotException:
            return False
        if not (isinstance(data, dict) and 'started' in data and 'init_time' in
                data and 'gametime' in data and 'public' in data):
            return False
        return Match(url, data['started'],
                data['init_time'],
                data['gametime'],
                data['public'])

    def __init__(self, url, started, init_time, gametime, public, auth_code=None):
        self.url = url
        self.started = started
        self.init_time = init_time
        self.gametime = gametime
        self.public = public
        self.auth_code = auth_code

    def register_slot(self):
        print "Connecting..."
        slot_url = url_concat(self.url, fetch(self.url, {'register': 't'}))
        print "Here is your robot's slot:\n    %s    \n" % slot_url
        print ("If your robot crashes, use that URL next time "
                "you connect to rejoin the match.\n")
        return slot_url

    def start(self):
        if not self.started and self.auth_code:
            fetch(self.url, {'start': 't', 'auth_code': self.auth_code})
        return True

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
        match = Match.from_url(url)
        if match:
            # if they already have a url like http://server/matches/aoa/robot_bbb,
            # then skip the step of registering stuff and just reconnect them.
            try:
                url = match.register_slot()
            except RobotException:
                print "That's not a match URL!"
                return False
        print "Waiting for game to start..."
        r =  Robot.connect(url, **kwargs)
        print "Connected."
        return r

class RobotException(Exception):
    pass
