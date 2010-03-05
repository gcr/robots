// One single match
//
var
  sys    = require('sys'),
  events = require('events'),
  assert = require('assert');

function Match(mid, authCode, pub) {
  this.mid = mid;
  this.authCode = authCode;
  this.pub = pub;
}
sys.inherits(Match, events.EventEmitter);


process.mixin(exports,
  {
    Match: Match
  }
);
