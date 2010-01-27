#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource, error, http
from twisted.internet import reactor

from robots.server.json_resource import JsonResource
from robots.server.matches import Matches, Match

# Which port to run on?
PORT = 8080

ROUTES = {
            'matches': Matches(),
}


# -----------------------
root = resource.Resource()
for route in ROUTES:
    root.putChild(route, ROUTES[route])

reactor.listenTCP(PORT, server.Site(root))
print "Ready to run"
reactor.run()

