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
      self.initTime = minfo.init_time;
      self.started = minfo.started;
      self['private'] = minfo['private'];
      self.robots = [];
      for (var i = 0,l = minfo.robots.length; i < l; i++) {
        self.robots[i] = new Robot(minfo.robots[i]);
      }
      if (typeof cb == 'function') {
        cb(self);
      }
      if (typeof self.onMatchStartedCb == 'function') {
        self.onMatchStartedCb();
      }
      if (stream) {
        self.beginStream(minfo.history);
      }
      self.populating = false;
    });
};
Match.prototype.beginStream = function(time) {
  var self = this;
  this.sh = new courier.core.StreamingHistory(this.url + "?history=t",
      time,
      function(action) {
        if (action.hasOwnProperty('field') &&
            typeof self.onFieldUpdateCb == 'function') {
          self.onFieldUpdateCb(action.field);
        } else if (action.hasOwnProperty('hit') &&
                   typeof self.onHitCb == 'function') {
          self.onHitCb(action.hit.obj, action.hit.location);
        } else if (action.hasOwnProperty('splash_damage') &&
                   typeof self.onSplashCb == 'function') {
          self.onSplashCb(action.splash_damage.objects,
                          action.splash_damage.location,
                          action.splash_damage.damage);
        } else if (action.hasOwnProperty('remove_robot') &&
                   typeof self.onRemoveRobotCb == 'function') {
          self.onRemoveRobotCb(new Robot(action.remove_robot));
        } else if (action.hasOwnProperty('disconnect_robot') &&
                   typeof self.onDisconnectRobotCb == 'function') {
          self.onDisconnectRobotCb(new Robot(action.disconnect_robot));
        } else if (action.hasOwnProperty('connected_robot') &&
                   typeof self.onConnectedRobotCb == 'function') {
          self.onConnectedRobotCb(new Robot(action.connected_robot));
        } else if (action.hasOwnProperty('new_slot') &&
                   typeof self.onNewSlotCb == 'function') {
          self.onNewSlotCb(new Robot(action.new_slot));
        } else if (action.hasOwnProperty('match_started') &&
                   typeof self.onMatchStarted == 'function') {
          self.onMatchStarted();
        }
      });
};
courier.core.createPropertySetters(Match, "Cb",
    ["onFieldUpdate",
     "onHit",
     "onSplash",
     "onRemoveRobot",
     "onNewSlot",
     "onDisconnectRobot",
     "onConnectedRobot",
     "onMatchStarted"]);

// public methods
return {
  Robot: Robot,
  Match: Match
};

})();  // end courier namespace
