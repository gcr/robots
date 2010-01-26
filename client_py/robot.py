#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urljoin, urlsplit
import urllib2
import socket
import json

class Server:
    MATCH = "matches/"
    REGISTER = "register"

    def __init__(self, url="http://localhost:8080"):
        u = urlsplit(url)
        self.host = "%s://%s" % (u[0], u[1])

    # useful functions
    def url_splice(self, *parts):
        parts = list(parts)
        # remove trailing slash
        if parts[0].strip()[-1] != '/':
            parts[0] = parts[0].strip() + "/"
        return ''.join(parts)

    def _fetch_raw(self, url):
        return urllib2.urlopen(url).read()

    def _fetch(self, url):
        return json.loads(self._fetch_raw(url))

    def _fetch_persist(self, url):
        try:
            return self._fetch(url)
        except urllib2.URLError, e:
            if isinstance(e.reason, socket.timeout):
                return self._fetch_persist(url)
            else:
                raise e

    def register_match(self):
        """
        Register a match, then return a URL of that match.
        """
        match_code = self._fetch(self.url_splice(self.host, self.MATCH, self.REGISTER))
        return self.url_splice(self.host, self.MATCH, match_code)

