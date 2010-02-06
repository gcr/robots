#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
This class keeps track of the history for the game state.
"""
from twisted.internet.defer import Deferred
from twisted.web import resource, server
from json_resource import JsonResource

class History():
    """
    Represents the state of something in time.
    """
    def __init__(self):
        self.deferreds = {}
        self.history = []
        self.time = 0

    def add(self, to_store):
        """
        Store to_store into our history and run our callbacks. It is your
        responsibility to copy (not reference) it. You can store to any
        arbitrary place in the future.
        """
        time = len(self.history)
        self.history.append(to_store)
        if time in self.deferreds:
            for d in self.deferreds[time]:
                d.callback(to_store)
            del self.deferreds[time]

    def notify_when(self, time):
        """
        Return a deferred that will be called when the history is available.
        """
        d = Deferred()
        if time < len(self.history):
            d.callback(self.history[time])
        else:
            if time not in self.deferreds:
                self.deferreds[time] = []
            self.deferreds[time].append(d)
        return d

    def catch_up(self, time):
        """
        Returns a deferred that will be called with a list of all evence since
        the given time.
        """
        d = self.notify_when(time)
        def get_all_history_since(_):
            return self.history[time:]
        d.addCallback(get_all_history_since)
        return d


class HistoryResource(resource.Resource):
    """
    This class allows you to get live, streaming events from a history.
    Call it like this:
    http://somehost/someresource?since=0
    and the server will block until it gets everything.
    Call
    http://somehost/someresource?get_time=t
    and the server will immediately let you know what the next time is.
    """
    def __init__(self, history):
        resource.Resource.__init__(self)
        self.history = history
    def render_GET(self, request):
        if 'get_time' in request.args:
            return str(len(self.history.history))
        assert 'since' in request.args, 'Must have some time since something'
        t = int(request.args['since'][0])
        d = self.history.catch_up(t)
        def report_history_to_client(history):
            JsonResource(history).render(request)
        d.addCallback(report_history_to_client)
        return server.NOT_DONE_YET
