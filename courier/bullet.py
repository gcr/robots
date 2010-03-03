#!/usr/bin/env python
# -*- coding: utf-8 -*-

import fieldobject

class bullet(fieldobject.FieldObject):
    def __init__(self, field, location):
        self.location = location
        self.speed = 0
        self.rotation = 0
        self.throttle = 0
        self.field = field

    def __json__(self):
        return {'type': 'bullet',
                'location': self.location,
                'rotation': self.rotation}

    def field_info(self):
        # The field will send this information to the client. It should be
        # enough to draw on the screen.
        return self.__json__()
