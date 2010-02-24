#!/usr/bin/env python
# -*- coding: utf-8 -*-

import string
import random
import socket

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
    if str(s).lower() in ["false", "nil", "null", "0", "no", "f", "n"]:
        return False
    return True

# Utility function to guess the IP (as a string) where the server can be
# reached from the outside. Quite nasty problem actually.
# (thanks to woof; the license of this function is as follows)
#  woof -- an ad-hoc single file webserver
#  Copyright (C) 2004-2009 Simon Budig  <simon@budig.de>
# 
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
# 
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
# 
#  A copy of the GNU General Public License is available at
#  http://www.fsf.org/licenses/gpl.txt, you can also write to the
#  Free Software  Foundation, Inc., 59 Temple Place - Suite 330,
#  Boston, MA 02111-1307, USA.

def find_ip ():
   # we get a UDP-socket for the TEST-networks reserved by IANA.
   # It is highly unlikely, that there is special routing used
   # for these networks, hence the socket later should give us
   # the ip address of the default route.
   # We're doing multiple tests, to guard against the computer being
   # part of a test installation.

   candidates = []
   for test_ip in ["192.0.2.0", "198.51.100.0", "203.0.113.0"]:
      s = socket.socket (socket.AF_INET, socket.SOCK_DGRAM)
      s.connect ((test_ip, 80))
      ip_addr = s.getsockname ()[0]
      s.close ()
      if ip_addr in candidates:
         return ip_addr
      candidates.append (ip_addr)

   return candidates[0]

