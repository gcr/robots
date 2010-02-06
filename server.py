#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource, error, http, static
from twisted.internet import reactor
from server.custom_factories import JsonTracebackSite
from server.matches import Matches, Match
from server import jinja_resource

# Which port to run on?
PORT = 8080

ROUTES = {
            '':        jinja_resource.Index(),
            '/':       jinja_resource.Index(),
            'index':   jinja_resource.Index(),
            'matches': Matches(),
}



root = resource.Resource()
for route in ROUTES:
    root.putChild(route, ROUTES[route])

reactor.listenTCP(PORT, JsonTracebackSite(root))
print "Ready to run"
reactor.run()

