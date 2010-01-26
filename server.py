#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource, error, http
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

class ConnectionTrackingRequest(server.Request):
    """
    I'm just like server.Request but I know if the client is still connected or
    not.
    """
    def __init__(self, *args):
        server.Request.__init__(self, *args)
        self.connected = True

    def connectionLost(self, reason):
        http.Request.connectionLost(self, reason)
        self.connected = False
        print "Connection lost"

class MySite(server.Site):
    requestFactory = ConnectionTrackingRequest

reactor.listenTCP(PORT, MySite(root))
print "Ready to run"
reactor.run()

