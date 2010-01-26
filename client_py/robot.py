#!/usr/bin/env python
# -*- coding: utf-8 -*-

from urlparse import urljoin
import urllib2
import socket
import json

class URLTools:
    MATCH = "matches/"
    REGISTER = "register"

    @classmethod
    def url_splice(self, *parts):
        parts = list(parts)
        # remove trailing slash
        if parts[0].strip()[-1] != '/':
            parts[0] = parts[0].strip() + "/"
        return ''.join(parts)

    @classmethod
    def fetch(self, url):
        return urllib2.urlopen(url).read()
        try:
            return urllib2.urlopen(url, timeout=5).read()
        except urllib2.URLError, e:
            if isinstance(e.reason, socket.timeout):
                return self.fetch_url(url)
            else:
                raise e


    @classmethod
    def fetch_json(self, url):
        return json.loads(self.fetch(url))

    @classmethod
    def match_url(self, url):
        """
        Given a base URL, return the match URL.
        """
        return self.url_splice(url, MATCH)

    @classmethod
    def register_match(self, url):
        """
        Register a match, then return a URL of that match.
        """
        match_code = self.fetch_json(self.url_splice(url, self.MATCH, self.REGISTER))
        print self.url_splice(url, self.MATCH, self.REGISTER)
        print match_code
        return self.url_splice(url, self.MATCH, match_code)

