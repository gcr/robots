// site.js -- almost exclusively called by server.js, site.js describes how
//             to render requests that we grab, except without all the
//             neckties that come in a normal enterprise-y URL dispatch system.
//             Note that we also add a few ears for trapping events as well.
var
  switchboard   = require('switchboard'),
  url           = require('url'),
  ears          = require('ears'),
  hist          = require('history'),
  assert        = require('assert'),
  renderHistory = require('misc').renderHistory,
  renderJson    = require('misc').renderJson,
  buildUuid     = require('misc').buildUuid,
  booleanize    = require('misc').booleanize,
  respondWith   = require('misc').respondWith,
  log           = require('log'),
  staticFiles   = require('static'),
  routes        = {};

function addRoutes(newRoutes) {
  return process.mixin(routes, newRoutes);
}


// Which match list will we do? (set from server.js)
function genMatchListSite(matches) {
  // Duck punching!
  matches.history = new hist.History();

  /////// EVENTS ///////
  ears.listenFor({
    'MatchList': {
      'newMatch':
        function(match) {
          if (match.pub) {
            matches.history.add({"added": match.mid});
          }
        },
      'removeMatch':
        function(match) {
          if (match.pub) {
            matches.history.add({"removed": match.mid});
          }
        }
    }
  });

  /////// ROUTING TABLE ///////
  return addRoutes({
    // Default page.
    // http://localhost:8080/
    '': staticFiles.makeFileServer("server/static/index.htm"),
    'css': staticFiles.makeFileServer("server/static/css"),
    'js': staticFiles.makeFileServer("server/static/js"),

    'test': staticFiles.makeFileServer("server/static/"),

    'matches': switchboard.dispatchOnePath(
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
        // http://localhost:8080/matches/
        function(req, res) {
          // Render information on the match list
          var mjson = matches.toJson();
          mjson.history = matches.history.time();
          return renderJson(req, res, mjson);
        },
        [],
        staticFiles.makeFileServer("server/static/matches.htm")
      )
    ) // end matches/
  }); // end addRoutes

} // end function


// Use this function to do things from our HTTP server.
function dispatch(req, res) {
  try {
    switchboard.dispatch(req, res,
      url.parse(req.url).pathname,
      routes);
  } catch(err) {
    log.error("URL: " + req.url + "\n\n" + err.stack);
    renderJson(req, res, {'exception': err.message});
  }
}

process.mixin(exports,
  {
    routes: routes,
    addRoutes: addRoutes,
    dispatch: dispatch,
    genMatchListSite: genMatchListSite
  }
);
