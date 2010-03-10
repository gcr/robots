// match_list_views.js -- Defines views for a match list.
//             Note that we also add a few ears for trapping events as well.
//
var
  assert        = require('assert'),
  url           = require('url'),
  switchboard   = require('./switchboard'),
  ears          = require('../ears'),
  hist          = require('../history'),
  renderHistory = require('./view_helpers').renderHistory,
  renderJson    = require('./view_helpers').renderJson,
  buildUuid     = require('./view_helpers').buildUuid,
  booleanize    = require('./view_helpers').booleanize,
  staticFiles   = require('./static');

function makeMatchListSite(matches) {
  // Duck punching!
  matches.history = new hist.History();

  /////// EVENTS ///////
  ears.listenFor({
    'MatchList': {
      'newMatch': function(match) {
        if (match.pub) {
          matches.history.add({"added": match.mid});
        }
      },
      'removeMatch': function(match) {
        if (match.pub) {
          matches.history.add({"removed": match.mid});
        }
      }
    }
  });


  // This will get plugged into site.js
  return switchboard.dispatchOnePath(
    function (req, res, matchName) {
      // http://localhost:8080/matches/foo
      assert.ok(matchName in matches.matches, "That match doesn't exist!");
      // Render the match
      // TODO
      renderJson(req, res, matches.matches[matchName]);
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
    makeMatchListSite: makeMatchListSite
  }
);
