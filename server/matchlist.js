// Match list
//
var
  sys    = require('sys'),
  match  = require('./match'),
  events = require('events'),
  assert = require('assert');

function MatchList() {
  this.matches = {};
}
sys.inherits(MatchList, events.EventEmitter);

MatchList.prototype.toJson = function() {
  // Returns a JSON representation of us.
  // Just a list of matches, please.
  var matches = [];
  for (var m in this.matches) {
    if (this.matches.hasOwnProperty(m) && this.matches[m].pub) {
      matches.push(m);
    }
  }
  return {'matches': matches};
};

MatchList.prototype.registerNew = function(mid, authCode, pub) {
  pub = (typeof pub == 'undefined')? true : pub;
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
  this.emit("removeMatch", m);
};

process.mixin(exports,
  {
    MatchList: MatchList
  }
);
