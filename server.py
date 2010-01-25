#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource, error
from twisted.internet import reactor

from server_utils.json_resource import JsonResource
from server_utils.matches import Matches, Match

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
reactor.run()

