#!/usr/bin/env python
# -*- coding: utf-8 -*-

import string
import random

def random_string(size):
    """
    Returns a random string of digits guaranteed not to be in self.matches
    """
    x = ''.join(random.choice(string.letters + string.digits) for _ in
            xrange(size))
    return x


