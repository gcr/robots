/*
 * match.js -- utility functions for matches and match lists
 * requires jquery
 **/

var courier = courier || {};

courier.match = (function() { // begin courier namespace

/* ------------------ Robots --------------------- */
function Robot () {
  var r = arguments[0];
  if (typeof r == 'object' && r !== null) {
    this.name = r.name;
    this.armor = r.armor;
    this.heat = r.heat;
  }
  this.jq = $("<div>");
}
Robot.prototype.render_row = function() {
  if (this.name) {
    this.jq.html("<\"" + this.name + "\", armor: " + this.armor + ">");
  } else {
    this.jq.html("(no robot)");
  }
};


/* ------------------ Match list --------------------- */
function Match(id) {
  // Represents a match.
  this.mid = id;
  this.url = "/matches/" + id;
  this.populating = false;
}
Match.prototype.populate = function(stream, cb) {
  // get information about this match and run the callback.
  if (this.populating) {
    return false;
  }
  this.populating = true;
  var self = this;
  courier.core.ajaxRequest(this.url, {info: true},
    function(minfo){
      self.init_time = minfo.init_time;
      self.started = minfo.started;
      self['private'] = minfo['private'];
      self.robots = [];
      for (var i = 0,l = minfo.robots.length; i < l; i++) {
        self.robots[i] = new Robot(minfo.robots[i]);
      }
      if (typeof cb == 'function') {
        cb(self);
      }
      if (stream) {
        self.begin_stream(minfo.history);
      }
      self.populating = false;
    });
};
Match.prototype.begin_stream = function(time) {
  var self = this;
  this.sh = new courier.core.StreamingHistory(this.url + "?history=t",
      time,
      function(action) {
        console.log(action);
      });
};

function MatchList() {
  // represents a new match list. run populate(jq) to populate into a jquery
  // object.
  this.matches = {};
  this.match_del_cb = {};
  this.populating = false;
  this.new_match_callback = undefined;
}
MatchList.prototype.populate = function(stream, cb) {
  // Get the list of matches, and run cb when we get them all.
  if (this.populating) {
    // we're already waiting!
    return false;
  }
  this.populating = true;
  var self = this;
  courier.core.ajaxRequest("/matches", {list: true},
    function(matchstate) {
      // retreive the list of matches
      for (var l=matchstate.matches.length, i=0; i < l; i++) {
        var m = new Match(matchstate.matches[i]);
        self.new_match(m);
      }
      if (typeof cb == 'function') {
        cb();
      }
      if (stream) {
        self.begin_stream(matchstate.history);
      }
      // finish up; release the 'lock'
      self.populating = false;
    });
};
MatchList.prototype.begin_stream = function(time) {
  // start streaming since 'time'
  var self = this;
  this.sh = new courier.core.StreamingHistory("/matches?history=t",
    time,
    function (action) {
      if ('added' in action) {
        self.new_match(new Match(action.added));
      } else if ('removed' in action) {
        self.remove_match(self.matches[action.removed]);
      }
    });
};
MatchList.prototype.stop_stream = function() {
  // stop streaming
  if (this.sh !== undefined) {
    this.sh.stop();
  }
};
MatchList.prototype.on_new_match = function(cb) {
  // run the specified callback when a new match appears!
  this.new_match_callback = cb;
};
MatchList.prototype.new_match = function(match) {
  // add the match to us
  this.matches[match.mid] = match;
  if (typeof this.new_match_callback == 'function') {
    this.new_match_callback(match);
  }
};
MatchList.prototype.on_match_delete = function(match, cb) {
  // be sure to run this callback when we delete a match.
  this.match_del_cb[match.mid] = cb;
};
MatchList.prototype.remove_match = function(match) {
  // delete the given match.
  if (typeof this.match_del_cb[match.mid] == 'function') {
    this.match_del_cb[match.mid](match);
  }
  delete this.matches[match.mid];
};

function registerMatch(priv, speed, start_timeout, lockstep) {
  // Register a new match on the server.
  // priv: Whether to show the match on the server list.
  // speed: how fast (in seconds) each step should be
  // start_timeout: how long to wait until we start
  // lockstep: whether to immediately step if all the robots have an action
  //   queued
  // you can also pass a callback: run this function when the match is
  //   registered.
  //
  // we will pass a match object and the auth code into the callback.
  var cb;
  if (arguments.length > 0 && typeof arguments[arguments.length-1] == 'function') {
    cb = arguments[arguments.length-1];
  } else {
    cb = undefined;
  }
  courier.core.ajaxRequest("/matches?register=t",
      {'private': typeof priv != 'function'? priv : undefined,
        speed: typeof speed != 'function'? speed : undefined,
        start_timeout: typeof start_timeout != 'function'? start_timeout : undefined,
        lockstep: typeof lockstep != 'function'? lockstep : undefined}, 
        function(data) {
          if (cb) {
            cb(new Match(data.match), data.auth_code);
          }
        });
}

// public methods
return {
  Robot: Robot,
  Match: Match,
  MatchList: MatchList,
  registerMatch: registerMatch
};

})();  // end courier namespace
