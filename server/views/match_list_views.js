// match_list_views.js -- Defines views for a match list.
//             Note that we also add a few ears for trapping events as well.
//
var
  assert        = require('assert'),
  url           = require('url'),
  ears          = require('../ears'),
  hist          = require('../history'),
  matchViews    = require('./match_views'),
  switchboard   = require('./switchboard'),
  renderHistory = require('./view_helpers').renderHistory,
  renderJson    = require('./view_helpers').renderJson,
  buildUuid     = require('./view_helpers').buildUuid,
  booleanize    = require('./view_helpers').booleanize,
  staticFiles   = require('./static');

function makeMatchListViews(matches) {
  // Duck punching!
  matches.history = new hist.History();

  /////// EVENTS ///////
  // technically we don't really need to add it here, but it's nice knowing
  // that a matchlist will always have matches.history
  ears.listenFor({
    'MatchList': {
      'newMatch': function(mlist, match) {
        if (match.pub) {
          matches.history.add({"added": match.mid});
        }
      },
      'removeMatch': function(mlist, match) {
        if (match.pub) {
          matches.history.add({"removed": match.mid});
        }
      }
    }
  });


  // This will get plugged into site.js
  return switchboard.dispatchOnePath(
    // has a match (eg http://localhost:8080/matches/foo)
    function(req, res, matchName, path) {
      assert.ok(matchName in matches.matches, "That match doesn't exist!");
      return matchViews.dispatchMatchViews(req, res, matches.matches[matchName], path);
    },

    // no path
    switchboard.makeDispatchQueryOverloader(
      // http://localhost:8080/matches/?register=t
      ['history'],
      renderHistory(matches.history),

      ['register'],
      function(req, res) {
        //renderJson(req, res, matches.registerNew("hello"));
        var query =  url.parse(req.url, true).query || {};
        var m = matches.registerNew(
          buildUuid(15), // mid
          buildUuid(15), // auth
          !booleanize(query['public']));
        renderJson(req, res, {'match': m.mid, 'auth_code': m.authCode});
      },

      ['list'],
      // http://localhost:8080/matches?list
      function(req, res) {
        // Render information on the match list
        return renderJson(req, res, process.mixin(matches.toJson(),
          {
            history: matches.history.time()
          }
        ));
      },

      // http://localhost:8080/matches
      [],
      staticFiles.makeFileServer("server/static/matches.htm")
    )
  );


}

process.mixin(exports,
  {
    makeMatchListViews: makeMatchListViews
  }
);
