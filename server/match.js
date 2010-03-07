// One single match
//
var
  sys    = require('sys'),
  events = require('events'),
  assert = require('assert');

function Match(mid, authCode, pub) {
  this.started = false;
  this.initTime = Date();
  this.mid = mid;
  this.authCode = authCode;
  this.pub = pub;
  // field_size
  // speed
  // robots
}
sys.inherits(Match, events.EventEmitter);

Match.prototype.toJson = function() {
  // TODO: the python code actually calls game.__json__() and then adds these
  // properties on top of it.
  return {
    started: this.started,
    init_time: this.initTime,
    'public': this.pub

  };
};


process.mixin(exports,
  {
    Match: Match
  }
);
