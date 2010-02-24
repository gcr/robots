#!/usr/bin/env python
# -*- coding: utf-8 -*-

print "Starting up..."

from twisted.web import resource, static
from twisted.internet import reactor
from server.custom_factories import JsonTracebackSite
from server.matches import Matches
from server import jinja_resource
from server import utils

# Which port to run on?
PORT = 8080

ROUTES = {
            '':        jinja_resource.Index(),
            '/':       jinja_resource.Index(),
            'js':      static.File("server/static/js"),
            # may use clevercss for the following
            'css':     static.File("server/static/css"),
            'img':     static.File("server/static/img"),
            'matches': Matches(),
}



root = resource.Resource()
for route in ROUTES:
    root.putChild(route, ROUTES[route])

reactor.listenTCP(PORT, JsonTracebackSite(root))
print "courier running on http://%s:%d/" % (utils.find_ip(), PORT)
reactor.run()

