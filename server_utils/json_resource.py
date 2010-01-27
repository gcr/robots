#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import resource, server
import json

class JsonResource(resource.Resource):
    """
    Renders something as a JSON object.
    """
    def __init__(self, obj):
        resource.Resource.__init__(self)
        self.obj = obj

    def render_GET(self, request):
        request.write(json.dumps(self.obj))
        request.finish()
        return server.NOT_DONE_YET
        # ^ seems deceptive, but is the correct way of handling this case.
        # Later versions of twisted will likely return a deferred instead.
        # render() is supposed to either return a string or NOT_DONE_YET
        # immediately, twisted doesn't know that we'll save the request object
        # and directly write to it later even though it's completely supported

