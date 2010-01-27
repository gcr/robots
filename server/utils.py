#!/usr/bin/env python
# -*- coding: utf-8 -*-

import string
import random

def random_string(self):
    """
    Returns a random string of digits guaranteed not to be in self.matches
    """
    x = ''.join(random.choice(string.letters + string.digits) for _ in
            xrange(15))
    return x if x not in self.matches else self.new_random_match()


