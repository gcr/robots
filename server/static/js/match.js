/*
 * match.js -- utility functions for matches and match lists
 * requires jquery
 **/

var courier = courier || {};

courier.match = (function() { // begin courier namespace

/* ------------------ Robots --------------------- */
function Robot (r) {
  if (typeof r == 'object' && r !== null) {
    this.name = r.name;
    this.armor = r.armor;
    this.heat = r.heat;
  }
  this.jq = $("<div>");
}


/* ------------------ Match --------------------- */
function Match(id, authCode) {
  // Represents a match.
  this.mid = id;
  this.url = "/matches/" + id;
  this.populating = false;
  this.starting = false;
  this.started = false;
  this.authCode = authCode;
}
Match.prototype.populate = function(stream, cb) {
  // Get information about this match and run the callback when we have it.
  if (this.populating) {
    return false;
  }
  this.populating = true;
  var self = this;
  courier.core.ajaxRequest(this.url, {'info': true},
    function(minfo){
      self.initTime = minfo.init_time;
      self.started = minfo.started;
      self['private'] = minfo['private'];
      self.robots = [];
      // the following is a callback. each one should correspond to one slot
      // in self.robots. Be sure to keep track of this and keep it updated!
     self.onDisconnectRobotCb = [];
      for (var i = 0,l = minfo.robots.length; i < l; i++) {
        self.newSlot();
        if (minfo.robots[i]) {
          self.connectRobot(new Robot(minfo.robots[i]));
        }
      }
      if (typeof cb == 'function') {
        cb(self);
      }
      if (minfo.started) {
        self.matchStarted();
      }
      if (stream) {
        self.beginStream(minfo.history);
      }
      self.populating = false;
    });
};
Match.prototype.beginStream = function(time) {
  function get_action(data) {
    // Assumes that the object has just one property. We'll return that for
    // you. get_action({'match_started': true}) => 'match_started'
    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        return i;
      }
    }
    return null;
  }
  var self = this;
  this.sh = new courier.core.StreamingHistory(this.url + "?history=t",
      time,
      function(action) {
        // This handles what to do when the server tells us something.
        switch (get_action(action)) {
          case 'field':
            if (typeof self.onFieldUpdateCb == 'function') {
              self.onFieldUpdateCb(action.field);
            }
            break;
          case 'hit':
            if (typeof self.onHitCb == 'function') {
              self.onHitCb(action.hit.obj, action.hit.location);
            }
            break;
          case 'splash_damage':
            if (typeof self.onSplashCb == 'function') {
              self.onSplashCb(action.splash_damage.objects,
                            action.splash_damage.location,
                            action.splash_damage.damage);
            }
            break;
          case 'remove_slot':
            self.removeSlot();
            break;
          case 'disconnect_robot':
            self.disconnectRobot(new Robot(action.disconnect_robot));
            break;
          case 'connected_robot':
            self.connectRobot(new Robot(action.connected_robot));
            break;
          case 'new_slot':
            self.newSlot();
            break;
          case 'match_started':
            self.startMatch();
            break;
        }
      });
};
Match.prototype.startMatch = function() {
  // Will try to start the match.
  if (this.authCode && !(this.starting || this.started)) {
    courier.core.ajaxRequest( this.url,
        {start: true, auth_code: this.authCode});
  }
};
Match.prototype.matchStarted = function() {
  // confused? Match.matchStarted() fires when someone starts the match.
  // However, Match.startMatch() will try to start the match if we have the
  // proper auth code.
  this.started = true;
  this.starting = false;
  if (typeof this.onMatchStartCb == 'function') {
    this.onMatchStartCb();
  }
};
Match.prototype.newSlot = function() {
  // Make a new blank slot.
  var l = this.robots.length;
  this.robots[l] = null;
  this.onDisconnectRobotCb[l] = null;
  if (typeof this.onNewSlotCb == 'function') {
    this.onNewSlotCb();
  }
};
Match.prototype.connectRobot = function(robot) {
  // Add this robot to our next empty slot.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] === null) {
      this.robots[i] = robot;
      if (typeof this.onConnectedRobotCb == 'function') {
        this.onConnectedRobotCb(this.robots[i]);
      }
      break;
    }
  }
};
Match.prototype.disconnectRobot = function(robot) {
  // The robot disconnected. We should clear its slot.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] && this.robots[i].name == robot.name) {
      this.robots[i] = null;
      if (typeof this.onDisconnectRobotCb[i] == 'function') {
        this.onDisconnectRobotCb[i](robot);
      }
      this.onDisconnectRobotCb[i] = null;
      break;
    }
  }
};
Match.prototype.removeSlot = function() {
  // The slot disappeared forever. We should clear it. The server will enusure
  // that it's disconnected first.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] === null) {
      this.robots.splice(i, 1);
      this.onDisconnectRobot.splice(i, 1);
      if (typeof this.onRemoveSlotCb == 'function') {
        this.onRemoveSlotCb();
      }
      break;
    }
  }
};
Match.prototype.onDisconnectRobot = function(robot, cb) {
  // Run this callback when this robot is disconnected.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] && this.robots[i].name == robot.name) {
      this.onDisconnectRobotCb[i] = cb;
      break;
    }
  }
};
courier.core.createPropertySetters(Match, "Cb",
    ["onFieldUpdate",
     "onHit",
     "onSplash",
     "onConnectedRobot",
     "onRemoveSlot",
     "onNewSlot",
     "onMatchStart"]);

// public methods
return {
  Robot: Robot,
  Match: Match
};

})();  // end courier namespace
