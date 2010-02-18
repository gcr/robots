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
        if (typeof self.onNewSlotCb == 'function') {
          self.onNewSlotCb();
        }
        if (minfo.robots[i]) {
          self.robots[i] = new Robot(minfo.robots[i]);
          if (typeof self.onConnectedRobotCb == 'function') {
            self.onConnectedRobotCb(self.robots[i]);
          }
        } else {
          self.robots[i] = null;
        }
      }
      if (typeof self.onMatchStartedCb == 'function') {
        self.onMatchStartedCb();
      }
      if (typeof cb == 'function') {
        cb(self);
      }
      if (stream) {
        self.beginStream(minfo.history);
      }
      self.populating = false;
    });
};
Match.prototype.beginStream = function(time) {
  var self = this;
  var callbacks = {
    'field': 'onFieldUpdateCb',
    'hit': 'onHitCb',
    'splash_damage': 'onSplashCb',
    'remove_robot': 'onRemoveRobotCb',
    'disconnect_robot': 'onDisconnectRobotCb',
    'connected_robot': 'onConnectedRobotCb',
    'new_slot': 'onNewSlotCb',
    'match_started': 'onMatchStarted'};
  function get_callback(data) {
    // Tells you which callback should be associated with the data.
    // for example, data might be {disconnected_robot: 'super harvey eater'} and
    // this little function would tell you that.
    for (var cb in callbacks) {
      if (callbacks.hasOwnProperty(cb)) {
        if (typeof data[cb] != 'undefined' && typeof self[callbacks[cb]] == 'function') {
          return cb;
        }
      }
    }
  }
  var rob, i, l;
  this.sh = new courier.core.StreamingHistory(this.url + "?history=t",
      time,
      function(action) {
        // This handles what to do when the server tells us something
        switch (get_callback(action)) {
          case 'field':
            self.onFieldUpdateCb(action.field);
            break;
          case 'hit':
            self.onHitCb(action.hit.obj, action.hit.location);
            break;
          case 'splash_damage':
            self.onSplashCb(action.splash_damage.objects,
                          action.splash_damage.location,
                          action.splash_damage.damage);
            break;
          case 'remove_robot':
            rob = new Robot(action.remove_robot);
            for (i=0,l=self.robots.length; i<l; i++) {
              if (self.robots[i].name == rob.name) {
                delete self.robots[i];
                break;
              }
            }
            self.onRemoveRobotCb(rob);
            break;
          case 'disconnect_robot':
            rob = new Robot(action.disconnect_robot);
            for (i=0,l=self.robots.length; i<l; i++) {
              if (self.robots[i] && self.robots[i].name == rob.name) {
                self.robots[i] = null;
                break;
              }
            }
            self.onDisconnectRobotCb(rob);
            break;
          case 'connected_robot':
            rob = new Robot(action.connected_robot);
            for (i=0,l=self.robots.length; i<l; i++) {
              if (self.robots[i] === null) {
                self.robots[i] = rob;
                break;
              }
            }
            self.onConnectedRobotCb(rob);
            break;
          case 'new_slot':
            self.robots[self.robots.length] = null;
            self.onNewSlotCb();
            break;
          case 'match_started':
            self.onMatchStarted();
            break;
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
