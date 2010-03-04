// Match list
//
var
  mlist  = exports,
  hist   = require('history'),
  sys    = require('sys'),
  events = require('events');

mlist.MatchList = function() {
  this.matches = {};
};
sys.inherits(mlist.MatchList, events.EventEmitter);

mlist.MatchList.prototype.registerNew = function(mid) {
  this.emit("newMatch", mid);
};
