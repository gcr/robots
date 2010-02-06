#!/usr/bin/env python
# -*- coding: utf-8 -*-

from jinja2 import Environment, PackageLoader
from twisted.web import resource, server

ENVIRONMENT = Environment(loader=PackageLoader('server', 'static'))

class JinjaResource(resource.Resource):
    template_name = None
    variables = {}

    def __init__(self, **kwargs):
        resource.Resource.__init__(self)
        self.template = ENVIRONMENT.get_template(self.template_name)
        self.variables = kwargs

    def render_GET(self, request):
        request.setHeader("Content-Type", "text/html; charset=utf-8")
        request.write(self.template.render(self.variables).encode('utf-8'))
        request.finish()
        return server.NOT_DONE_YET

    def getChild(self, path, request):
        if path == '':
            # allow trailing slash
            return self
        return resource.Resource.getChild(self, path, request)

class Index(JinjaResource):
    template_name = 'index.htm'
