/*
 * match.js -- utility functions for matches and match lists
 * requires jquery
 **/

var courier = courier || {};

courier.matchlist = (function() { // begin courier namespace

function MatchList() {
  // represents a new match list. run populate(jq) to populate into a jquery
  // object.
  courier.core.EventEmitter.call(this);
  this.matches = {};
  this.matchDelCb = {};
  this.populating = false;
}
courier.core.inherits(MatchList, courier.core.EventEmitter);

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
        var m = new courier.match.Match(matchstate.matches[i]);
        self.newMatch(m);
      }
      if (typeof cb == 'function') {
        cb();
      }
      if (stream) {
        self.beginStream(matchstate.history);
      }
      // finish up; release the 'lock'
      self.populating = false;
    });
};
MatchList.prototype.beginStream = function(time) {
  // start streaming since 'time'
  var self = this;
  this.sh = new courier.core.StreamingHistory("/matches?history=t",
    time,
    function (action) {
      if ('added' in action) {
        self.newMatch(new courier.match.Match(action.added));
      } else if ('removed' in action) {
        self.removeMatch(self.matches[action.removed]);
      }
    });
};
MatchList.prototype.stopStream = function() {
  // stop streaming
  if (this.sh !== undefined) {
    this.sh.stop();
  }
};
MatchList.prototype.newMatch = function(match) {
  // add the match to us
  this.matches[match.mid] = match;
  this.emit('newMatch', this, match);
};
MatchList.prototype.removeMatch = function(match) {
  // delete the given match.
  delete this.matches[match.mid];
  this.emit('removeMatch', this, match);
  // sorry!
  match.emit('removeMatch', match);
};

function registerMatch(pub, speed, startTimeout, lockstep) {
  // Register a new match on the server.
  // pub: Whether to show the match on the server list.
  // speed: how fast (in seconds) each step should be
  // startTimeout: how long to wait until we start
  // lockstep: whether to immediately step if all the robots have an action
  //   queued
  // you can also pass a callback: run this function when the match is
  //   registered. we'll pass a match object and the auth code in there
  //   for you.
  var cb;
  if (arguments.length > 0 && typeof arguments[arguments.length-1] == 'function') {
    cb = arguments[arguments.length-1];
  } else {
    cb = undefined;
  }
  courier.core.ajaxRequest("/matches?register=t",
      {'public': typeof pub != 'function'? pub : undefined,
        'speed': typeof speed != 'function'? speed : undefined,
        'start_timeout': typeof startTimeout != 'function'? startTimeout : undefined,
        'lockstep': typeof lockstep != 'function'? lockstep : undefined},
      function(data) {
        if (cb) {
          cb(new courier.match.Match(data.match), data.auth_code);
        }
      });
}

// public methods
return {
  MatchList: MatchList,
  registerMatch: registerMatch
};

})();  // end courier namespace
