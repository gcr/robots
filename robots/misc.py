#!/usr/bin/env python
# -*- coding: utf-8 -*-

import random

def pick_cool_name():
    """
    Pick a robot name for those too lazy (special?) to pick one themselves
    """
    prefix = ("mega ultra super trady killer spectra power tera kilo giga "
        "yocto proto buzzing sitting hyper canned scrapping astro "
        "rubber advanced tasty optimized kingly brave final spinning burning "
        "quantum illusion tracking mecha").split()

    middle = ("planet star chrono duck endurer bot test "
        "narwhal walrus eating razor spoon mountain typhoon hurricane "
        "storm opponent foe loser tracker king royalty mech voltage").split()

    suffix = ("killer crusher atomizer shooter v0.1 2.0 9000 1000 3000 1001 "
        "beta alpha prime robot bot buzzer sniper tank juggernaut man "
        "eater bender zapper warrior bringer optimizer").split()

    return ' '.join([random.choice(set) for set in 
        [prefix, middle, suffix]])

