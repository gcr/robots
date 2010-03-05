// Match list
//
var
  sys    = require('sys'),
  match  = require('match'),
  events = require('events'),
  assert = require('assert');

function MatchList() {
  this.matches = {};
}
sys.inherits(MatchList, events.EventEmitter);

MatchList.prototype.registerNew = function(mid, authCode, pub) {
  assert.ok(!(mid in this.matches), "This match already exists!");
  var m = this.matches[mid] = new match.Match(mid, authCode, pub);
  this.emit("newMatch", m);
  return m;
};

MatchList.prototype.findMid = function(match) {
  for (var k in this.matches) {
    if (k === match) {
      return k;
    }
  }
};

MatchList.prototype.remove = function(mid) {
  assert.ok(mid in this.matches, "This match doesn't exist!");
  var m = this.matches[mid];
  delete this.matches[mid];
  this.emit("removeMatch", mid);
};

process.mixin(exports,
  {
    MatchList: MatchList
  }
);
