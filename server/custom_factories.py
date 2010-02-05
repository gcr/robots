#!/usr/bin/env python
# -*- coding: utf-8 -*-

from server.json_resource import ErrorResource
from twisted.web import server, http
from twisted.python import log

class ErrorJsonRequest(server.Request):
    def processingFailed(self, reason):
        log.err(reason)
        self.setResponseCode(http.INTERNAL_SERVER_ERROR)
        ErrorResource(reason.value[0]).render(self)
        return reason

class JsonTracebackSite(server.Site):
    requestFactory = ErrorJsonRequest

