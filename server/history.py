#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
This class keeps track of the history for the game state.
"""
from twisted.internet.defer import Deferred

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


