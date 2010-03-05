// views.js -- almost exclusively called by routes.js, views.js describes how
//             to render requests that we grab, except without all the
//             neckties.

var
  switchboard = require('switchboard'),
  url         = require('url'),
  hist        = require('history'),
  renderHistory = require('misc').renderHistory,
  renderJson  = require('misc').renderJson,
  buildUuid   = require('misc').buildUuid,
  respondWith = require('misc').respondWith,
  log         = require('log'),
  mlist       = require('matchlist'),
  matches     = new mlist.MatchList();

/////// INITIALIZATION ////////
// Duck punching!
matches.history = new hist.History();
matches.addListener("newMatch", function(match) {
  log.info("Added match " + match);
  matches.history.add({"added": match});
});


/////// ROUTING TABLE ///////
var routes = {
  // Default page.
  // http://localhost:8080/
  '': function(req, res) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("Welcome!\n");
      res.close();
    },

  'matches': switchboard.dispatchQueryOverloadMega(
      ['history'],
      renderHistory(matches.history),
      ['register'],
      function(req, res) {
        //renderJson(req, res, matches.registerNew("hello"));
        renderJson(req, res, matches.registerNew(buildUuid(15)));
      }
    )

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
};


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

process.mixin(exports, {
  matches: matches,
  routes: routes,
  dispatch: dispatch
});
