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
    '': function(req, res) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("Welcome!\n");
        res.close();
      },

    'matches': switchboard.dispatchOnePath(
      function (req, res, matchName) {
        // http://localhost:8080/matches/foo
        assert.ok(matchName in matches.matches, "That match doesn't exist!");
        // Render the match
        // TODO
      },
      // http://localhost:8080/matches/?register=t
      switchboard.dispatchQueryOverloadMega(
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
        [],
        // http://localhost:8080/matches/
        function(req, res) {
          // Render information on the match list
          var mjson = matches.toJson();
          mjson.history = matches.history.time();
          return renderJson(req, res, mjson);
        }
      )
    ) // end matches/
  }); // end addRoutes

} // end function

    /*//////////// v¯¯ TESTING ¯¯v //////////
    'test': {
      // http://localhost:8080/test/a
      'a': function(req, res) {
          res.writeHeader(200, {"Content-Type": "text/plain"});
          res.write("Test A");
          res.close();
        },
      // http://localhost:8080/test/b
      'b': function(req, res) {
          res.writeHeader(200, {"Content-Type": "text/plain"});
          res.write("Test B");
          res.close();
        },
      // http://localhost:8080/test
      "": function(req, res) {
          res.writeHeader(200, {"Content-Type": "text/plain"});
          res.write("Test D+"); res.close();
        }
    },

    // This logs stuff when you go into it. A function that dispatches stuff.
    'log' : function(req, res, path) {
      log.warn("OHNOES: Somebody is going to " + req.url);
      return sb.dispatch(req, res, path, {
        'foo': function(req, res) {
          res.writeHeader(200, {"Content-Type": "text/plain"});
          res.write("Foo!\n");
          res.close();
        },
        'bar': function(req, res) {
          res.writeHeader(200, {"Content-Type": "text/plain"});
          res.write("Bar!\n");
          res.close();
        }});
    },

    // This section dispatches things based on query strings.
    'querydispatchtest': sb.dispatchQueryOverloadMega(
      ['a'],
      // http://localhost:8080/querydispatchtest?a=...
      function(req, res, a) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("A is: " + a);
        res.close();
      },

      ['b', 'c'],
      // http://localhost:8080/querydispatchtest?b=1&c=2
      function(req, res, b, c) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("B is: " + b + " and C is: " + c);
        res.close();
      },

      [],
      // http://localhost:8080/querydispatchtest
      function(req, res) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("Nothing at all?\n");
        res.close();
      })
      */


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
