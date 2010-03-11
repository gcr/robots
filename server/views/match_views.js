// Match views -- rendering a normal match
//

var
  assert     = require('assert'),
  ears       = require('../ears'),
  hist       = require('../history'),
  renderJson = require('./view_helpers').renderJson;

ears.listenFor({
  'MatchList': {
    'newMatch': function(mlist, match) {
      // Just minding my own business...
      match.history = new hist.History();
    }
  },
  'Match': {
    'newSlot': function(match) {
      match.history.add({'new_slot': true});
    },
    'removeSlot': function(match) {
      match.history.add({'remove_slot': true});
    }
  }
});

function dispatchMatchViews(req, res, match, path) {
  // matchListtViews is always nice enough to guarantee that match exists
  // and is a valid match.
  renderJson(req, res, match);
}

process.mixin(exports,
  {
    dispatchMatchViews: dispatchMatchViews
  }
);
