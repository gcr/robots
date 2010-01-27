#!/usr/bin/env python
# -*- coding: utf-8 -*-

from twisted.web import server, resource
from json_resource import JsonResource, ErrorResource
from twisted.internet import task, reactor
import utils

class RoboSocket(resource.Resource):
    """
    This class represents a robot and a connection with a client.
    """
    pass
