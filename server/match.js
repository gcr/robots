// One single match
//
var
  sys       = require('sys'),
  events    = require('events'),
  assert    = require('assert'),
  log       = require('./log'),
  gamelogic = require('./gamelogic');

function Match(mid, authCode, pub) {
  this.initTime = Date();
  this.mid = mid;
  this.authCode = authCode;
  this.pub = pub;
  this.game = new gamelogic.GameLogic();
  // field_size
  // speed
  // robots
}
sys.inherits(Match, events.EventEmitter);

Match.prototype.toJson = function() {
  // TODO: the python code actually calls game.__json__() and then adds these
  // properties on top of it.
  return process.mixin(this.game.toJson(),
    {
      init_time: this.initTime,
      'public': this.pub
    }
  );
};

Match.prototype.requestSlot = function(slotId) {
  // set this.game.robots[slot_id] to null and emit an event. Only if we're
  // not started.
  assert.ok(!this.game.started, "You cannot join a started match.");
  if (slotId in this.game.robots) {
    log.warn("Match " + this.mid + " tried to request " + slotId + ", a taken slot");
    return false;
  }
  this.game.robots[slotId] = null;
  this.emit("newSlot", this, slotId);
};

Match.prototype.removeSlot = function(slotId) {
  // remove this.game.robots[slotId], but ONLEH if we're not started. Emit an
  // event. gamelogic will call us.
  assert.ok(!this.game.started, "You cannot leave a started match.");
  if (!(slotId in this.game.robots)) {
    log.warn("Match " + this.mid + " tried to remove " + slotId + ", a nonexistent slot");
    return false;
  }
  delete this.game.robots[slotId];
  this.emit("removeSlot", this, slotId);
};


process.mixin(exports,
  {
    Match: Match
  }
);
