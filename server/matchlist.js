// Match list
//
var
  hist   = require('history'),
  sys    = require('sys'),
  events = require('events'),
  assert = require('assert');

function MatchList() {
  this.matches = {};
}
sys.inherits(MatchList, events.EventEmitter);

MatchList.prototype.registerNew = function(mid) {
  assert.ok(!(mid in this.matches), "This mid can't be in this match!");
  this.matches[mid] = null;
  this.emit("newMatch", mid);
};

process.mixin(exports, {
  MatchList: MatchList
});
