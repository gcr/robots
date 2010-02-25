#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urlparse, urlunparse
import urllib2
import urllib
import socket
import json

URL_CONFIG = {
        'matches': 'match',
}

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
    def register_slot(cls, url):
        """
        Returns a URL to a slot in a match.
        """
        path = urlparse(url)[2][1:]
        #                       ^ urlparse returns a path with a leading slash
        if path.startswith(URL_CONFIG['matches']):
            path = path[len(URL_CONFIG['matches'])+1:]
            #                            ^ must account for trailing slash
        if len(path.split('/')) < 2:
            print "Registering with match..."
            slot_url = url_concat(url, fetch(url, {'register': 't'}))
            print "Here is your robot's slot:\n    %s    \n" % slot_url
            print ("If your robot crashes, use that URL next time "
                    "you connect to rejoin the match.\n")
        else:
            slot_url = url
        return slot_url

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
        kwargs['connect'] = 't'
        slot_url = cls.register_slot(url)
        print "Waiting for game to start..."
        return Robot(slot_url, fetch_persist(slot_url, kwargs))

    @classmethod
    def register_match(cls, url, **kwargs):
        """
        Register a match, then return a URL of that match.
        """
        kwargs['register'] = 't'
        result = fetch(url_concat(url, URL_CONFIG['matches']), kwargs)
        return result

class RobotException(Exception):
    pass
