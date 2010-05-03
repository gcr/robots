/*
 * match.js -- utility functions for matches and match lists
 * requires jquery
 **/

var courier = courier || {};

courier.match = (function() { // begin courier namespace

/* ------------------ Robots --------------------- */
function Robot (r) {
  courier.core.EventEmitter.call(this);
  if (typeof r == 'object' && r !== null) {
    this.name = r.name;
    this.armor = r.armor;
  }
}
courier.core.inherits(Robot, courier.core.EventEmitter);

Robot.prototype.absDamage = function(newArmor) {
  // We were damaged! OHNOES! Set our armor to newArmor.
  this.armor = newArmor;
  this.emit("damaged", this);
};


/* ------------------ Match --------------------- */
function Match(id, authCode) {
  // Represents a match.
  courier.core.EventEmitter.call(this);
  this.mid = id;
  this.url = "/matches/" + id;
  this.populating = false;
  this.starting = false;
  this.started = false;
  this.authCode = authCode;
}
courier.core.inherits(Match, courier.core.EventEmitter);

Match.prototype.populate = function(stream, cb) {
  // Get information about this match and run the callback when we have more
  // information about ourself.
  if (this.populating) {
    // Guard: don't run this function twice at the same time
    return false;
  }
  this.populating = true;
  var self = this;
  courier.core.ajaxRequest(this.url, {'info': true},
    function(minfo){
      self.initTime   = minfo.init_time;
      self.started    = minfo.started;
      self.speed      = minfo.speed;
      self.field_geometry = minfo.field;
      self['public']  = minfo['public'];
      self.robots     = [];
      for (var i = 0,l = minfo.robots.length; i < l; i++) {
        // Generate all our robots
        self.newSlot();
        if (minfo.robots[i]) {
          self.connectRobot(new Robot(minfo.robots[i]));
        }
      }
      if (typeof cb == 'function') {
        // Now, what did you intend to do with all this information?
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
  // Follow this match.
  function get_action(data) {
    // Assumes that the object has just one property. This function will
    // return that for you. get_action({'match_started': true}) =>
    // 'match_started'
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
        case 'frame':
          // Added a new frame.
          self.processFrame(action.frame);
          break;
        //case 'field':
        //  // just pass it on
        //  self.emit('fieldUpdate', this, action.field);
        //  break;
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
          self.matchStarted();
          break;
        //case 'robot_damaged':
        //  self.robotDamaged(action.robot_damaged, action.new_armor);
        //  break;
      }
  });
};

Match.prototype.startMatch = function(cb) {
  // Will try to start the match. (As opposed to: signifying that somebody
  // else started the match; see this.matchStarted)
  if (this.authCode && !(this.starting || this.started)) {
    // another guard: don't run two of these at the same time!
    this.starting = true;
    var self = this;
    courier.core.ajaxRequest( this.url,
      {start: true, auth_code: this.authCode},
      function(result) {
        // no need to call self.matchStarted; the server may or may not
        // actually decide to start the match.
        self.starting = false;
        if (typeof cb == 'function') {
          cb(result);
        }
      });
  }
};

Match.prototype.matchStarted = function() {
  // confused? Match.matchStarted() fires when someone starts the match.
  // However, Match.startMatch() will try to start the match if we have the
  // proper auth code.
  this.started = true;
  this.starting = false;
  this.emit('matchStarted', this);
};

Match.prototype.newSlot = function() {
  // Make a new blank slot.
  this.robots.push(null);
  this.emit('newSlot', this);
};

Match.prototype.connectRobot = function(robot) {
  // Add this robot to our next empty slot.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] === null) {
      this.robots[i] = robot;
      this.emit('connectedRobot', this, robot);
      break;
    }
  }
};

Match.prototype.disconnectRobot = function(robot) {
  // The robot disconnected. We should clear its slot.
  // keep in mind: robot is actually a new robot that shares no events or
  // nothin' with the actual robot
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] && this.robots[i].name == robot.name) {
      var prevRobot = this.robots[i];
      this.robots[i] = null;
      this.emit('disconnectedRobot', prevRobot);
      // Sorry! Just calmly opening the cooler...
      // (this eases the burden on ui.js, which doesn't have to keep its own
      // separate list of robots)
      prevRobot.emit('disconnectedRobot', prevRobot);
      // quit on the first one we find
      break;
    }
  }
};

Match.prototype.robotDamaged = function(robot, newArmor) {
  // Tell the robot that it was damaged.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i].name == robot.name) {
      this.robots[i].absDamage(newArmor);
      break; // fail fast
    }
  }
};

Match.prototype.processFrame = function(frame) {
  // Frame looks like this:
  // { robots: ...
  //   objects: ...
  //   current_events: ... }
  // (see: views/frames.js)
  // just pass it on, but add events to robots.
  for (var ev in frame.current_events) {
      if (frame.current_events.hasOwnProperty(ev)) {
        if ('robot_damaged' in ev) {
          this.robotDamaged(ev.robot, ev.new_armor);
        }
      }
  }
  // drawing will slurp this up
  this.emit('newFrame', this, frame);
};

Match.prototype.removeSlot = function() {
  // The slot disappeared forever. We should clear it. The server will enusure
  // that it's disconnected first; no issues with which robot to remove.
  for (var i=0,l=this.robots.length; i<l; i++) {
    if (this.robots[i] === null) {
      this.robots.splice(i, 1);
      this.emit('removeSlot', this);
      break;
    }
  }
};

// public methods
return {
  Robot: Robot,
  Match: Match
};

})();  // end courier namespace
