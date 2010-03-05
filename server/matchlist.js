// Match list
//
var
  hist   = require('history'),
  sys    = require('sys'),
  events = require('events');

function MatchList() {
  this.matches = {};
}
sys.inherits(MatchList, events.EventEmitter);

MatchList.prototype.registerNew = function(mid) {
  this.emit("newMatch", mid);
};

process.mixin(exports, {
  MatchList: MatchList
});
