require.paths.push("./server");
var
  log         = require('log'),
  http        = require('http'),
  views       = require('views'),
  ears        = require('ears'),
  matchlist   = require('matchlist'),
  repl        = require('repl'),

  PORT        = 8080;


////////////////////////////////////////////////////
// Make a match list
var mlist = new matchlist.MatchList();

// this function adds all the URLs and whatever else we need.
views.genMatchListSite(mlist);


// Add all the ears you need above this line
ears.addEars('MatchList', mlist);
http.createServer(views.dispatch).listen(PORT);
log.debug("Started courier on " + Date() + "\nListening on port " + PORT);
log.info("This server's URL is http://localhost:" + PORT + "/\nGlobals: routes, views, matches, sys\n\nAt your command.");

// Help our repl out.
repl.scope.routes = views.routes;
repl.scope.views = views;
repl.scope.matches = mlist;
repl.scope.sys = require('sys');
repl.start();
process.stdio.addListener("close",
  function() {
    log.info("Server shutting down.\nLeaving so soon?");
    process.exit(0);
  });
