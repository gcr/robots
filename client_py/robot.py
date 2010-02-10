#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urlsplit
import urllib2
import urllib
import socket
import json

class Server:
    """
    This represents a fairly low-level link with a server.
    With the power of this class, you can talk directly to the server, fetch the
    results of a web page, etc. You'll likely want to use the higher level
    RoboLink API instead unless you're doing something really sneaky.
    """
    # constants - URL builders
    MATCH = "matches/"
    REGISTER = "register"

    def __init__(self, url="http://localhost:8080"):
        """
        Pass in a server URL, get a server object out. This won't work if your
        server is hosted as a subdirectory e.g.
        http://foobar:8080/robot_battles/
        """
        u = urlsplit(url)
        self.host = "%s://%s" % (u[0], u[1])

    # useful functions
    def url_splice(self, *parts):
        """
        splice a URL together; just concatenate it really
        """
        parts = list(parts)
        # remove trailing slash
        if parts[0].strip()[-1] != '/':
            parts[0] = parts[0].strip() + "/"
        return ''.join(parts)

    def _fetch_raw(self, url, **kwargs):
        """
        Fetch something from a web page, optionally encoding keyword arguments
        """
        if kwargs:
            url = url + "?" + urllib.urlencode(kwargs)
        return urllib2.urlopen(url).read()

    def _fetch(self, url, **kwargs):
        """
        Fetch a JSON object from a web page, encoding keyword parameters
        """
        result = json.loads(self._fetch_raw(url, **kwargs))
        # a 'client error' is when the server signals something to the client
        # and it's ALL THE CLIENT'S FAULT.
        if isinstance(result, dict) and 'client_error' in result:
            raise RobotException(result['client_error'])
        return result


    def _fetch_persist(self, url):
        """
        Fetch a JSON object from a web page, retrying in case of timeouts
        """
        try:
            return self._fetch(url)
        except urllib2.URLError, e:
            if isinstance(e.reason, socket.timeout):
                return self._fetch_persist(url)
            else:
                raise e

    def register_match(self, **kwargs):
        """
        Register a match, then return a URL of that match.
        """
        match_code = self._fetch(self.url_splice(self.host, self.MATCH,
            self.REGISTER), **kwargs)
        return self.url_splice(self.host, self.MATCH, match_code)

class RobotException(Exception):
    pass
