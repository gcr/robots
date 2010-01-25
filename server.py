#!/usr/bin/python
from twisted.web import server, resource, error
from twisted.internet import reactor
from twisted.internet import task
import random
import json

# class Simple(resource.Resource):
#     isLeaf = True
#     def __init__(self):
#         self.list_to_return = []
# 
#     def process_outstanding(self):
#         print self.list_to_return
#         for request in self.list_to_return:
#             request.write("hello there")
#             request.finish()
#         self.list_to_return = []
# 
#     def render_GET(self, request):
#         self.list_to_return.append(request)
#         return server.NOT_DONE_YET

class JsonResource(resource.Resource):
    """
    Renders something as a JSON object.
    """
    def __init__(self, obj):
        resource.Resource.__init__(self)
        self.obj = obj

    def render_GET(self, request):
        return json.dumps(self.obj)

class Matches(resource.Resource):
    """
    Represents a list of matches
    """
    def __init__(self):
        resource.Resource.__init__(self)
        self.matches = {}

    def render_GET(self, request):
        return "Match list here"

    def new_random_match(self):
        """
        returns a random string of digits guarantteed not to be in self.matches
        """
        x = ''.join(random.choice('abcdefghijklmnopqrstuvwxyz012345') for _ in xrange(5))
        return x if x not in self.matches else self.new_random_match()

    def getChild(self, path, request):
        if path.lower() == "register":
            n = self.new_random_match()
            self.matches[n] = "hello"
            print "New match registered: %s" % n
            return JsonResource(n)
        elif path in self.matches:
            return JsonResource(self.matches)
        else:
            return JsonResource({'error': 'No match!'})

root = resource.Resource()
root.putChild("matches", Matches())
site = server.Site(root)
#l = task.LoopingCall(s.process_outstanding)
#l.start(5)
reactor.listenTCP(8080, site)
reactor.run()

