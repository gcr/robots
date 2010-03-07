require.paths.push("./server");
var
  log         = require('log'),
  http        = require('http'),
  site       = require('site'),
  ears        = require('ears'),
  matchlist   = require('matchlist'),
  repl        = require('repl'),

  PORT        = 8080;


////////////////////////////////////////////////////
// Make a match list
var mlist = new matchlist.MatchList();

// this function adds all the URLs and whatever else we need.
site.genMatchListSite(mlist);
log.beginLogging();

// Add all the ears you need above this line
ears.addEars('MatchList', mlist);
http.createServer(site.dispatch).listen(PORT);
log.debug("Started courier on " + Date() + "\nListening on port " + PORT);
log.info("This server's URL is http://localhost:" + PORT + "/\nGlobals: routes, site, mlist, sys\n\nAt your command.");

// Help our repl out.
repl.scope.routes = site.routes;
repl.scope.site = site;
repl.scope.mlist = mlist;
repl.scope.sys = require('sys');
repl.start();
process.stdio.addListener("close",
  function() {
    log.info("Server shutting down.\nLeaving so soon?");
    process.exit(0);
  });
