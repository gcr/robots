require.paths.push("./server");
var
  log         = require('log'),
  http        = require('http'),
  views       = require('views'),
  repl        = require('repl'),

  PORT        = 8080;


////////////////////////////////////////////////////
http.createServer(views.dispatch).listen(PORT);
log.debug("Started courier on " + Date() + "\nListening on port " + PORT);
log.info("This server's URL is http://localhost:" + PORT + "/\nGlobals: routes, views, matches, sys\n\nAt your command.");

// Help our repl out.
repl.scope.routes = views.routes;
repl.scope.views = views;
repl.scope.matches = views.matches;
repl.scope.sys = require('sys');
repl.start();
process.stdio.addListener("close", function() {
    log.info("Server shutting down.\nLeaving so soon?");
    process.exit(0);
  });
