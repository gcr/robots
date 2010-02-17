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


def is_trueish(s):
    """
    returns true if something seems to be true, false if otherwise.
    """
    if str(s).lower() in ["", "false", "nil", "null", "0", "no"]:
        return False
    return True
