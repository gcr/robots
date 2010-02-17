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


/* ------------------ Match --------------------- */
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

// public methods
return {
  Robot: Robot,
  Match: Match
};

})();  // end courier namespace
