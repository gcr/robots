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
      // the following is a callback. each one should correspond to one slot
      // in self.robots.
      self.onDisconnectRobotCb = [];
      for (var i = 0,l = minfo.robots.length; i < l; i++) {
        self.newSlot();
        if (minfo.robots[i]) {
          self.connectRobot(new Robot(minfo.robots[i]));
        }
      }
      if (minfo.started) {
        self.startMatch();
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
  function get_action(data) {
    // Assumes that the object has just one property. We'll return that for
    // you.
    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        return i;
      }
    }
    return null;
  }
  this.sh = new courier.core.StreamingHistory(this.url + "?history=t",
      time,
      function(action) {
        // This handles what to do when the server tells us something
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
          case 'remove_robot':
            self.removeSlot(action.remove_robot? new Robot(action.remove_robot) : null);
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
  if (typeof this.onMatchStartCb == 'function') {
    this.onMatchStartCb();
  }
};
Match.prototype.newSlot = function() {
  // Make a new slot. Will return the slot number.
  //todo: create a blank slot.
  var l = this.robots.length;
  this.robots[l] = null;
  this.onDisconnectRobotCb[l] = null;
  if (typeof this.onNewSlotCb == 'function') {
    this.onNewSlotCb();
  }
};
Match.prototype.connectRobot = function(robot) {
  // Add a robot to our next newest slot.
  //todo: add robot to the next blank slot.
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
Match.prototype.removeSlot = function(robot) {
  // The robot or slot disappeared forever. We should clear it.
  // if robot !== null, then disconnect it first.
  //todo: remove slot and all CBs
  if (robot !== null) {
    this.disconnectRobot(robot);
  }
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] === null) {
      delete this.robots[i];
      delete this.onDisconnectRobot[i];
      if (typeof this.onSlotRobotCb == 'function') {
        this.onSlotRobotCb(robot);
      }
      break;
    }
  }
};
Match.prototype.onDisconnectRobot = function(robot, cb) {
  // Run this callback when this robot is disconnected.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i].name == robot.name) {
      this.onDisconnectRobotCb[i] = cb;
    }
    break;
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
