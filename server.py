#!/usr/bin/python
from twisted.web import server, resource, error
from twisted.internet import reactor
from twisted.internet import task

class Simple(resource.Resource):
    isLeaf = True
    def __init__(self):
        self.list_to_return = []

    def process_outstanding(self):
        print self.list_to_return
        for request in self.list_to_return:
            request.write("hello there")
            request.finish()
        self.list_to_return = []

    def render_GET(self, request):
        self.list_to_return.append(request)
        return server.NOT_DONE_YET

s = error.Error("Page not found")
site = server.Site(s)
#l = task.LoopingCall(s.process_outstanding)
#l.start(5)
reactor.listenTCP(8080, site)
reactor.run()

