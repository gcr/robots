// One single match
//
var
  sys       = require('sys'),
  events    = require('events'),
  assert    = require('assert'),
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

Match.prototype.requestSlot = function(slot_id) {
  // set this.game.robots[slot_id] to null and emit an event. Only if we're
  // not started.

};

Match.prototype.removeSlot = function(slot_id) {
  // remove this.game.robots[slot_id], but ONLEH if we're not started. Emit an
  // event. gamelogic will call us.

};


process.mixin(exports,
  {
    Match: Match
  }
);
