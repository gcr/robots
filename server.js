require.paths.push("./server");
var
  log         = require('log'),
  http        = require('http'),
  routes      = require('routes'),
  repl        = require('repl'),

  PORT        = 8080;


////////////////////////////////////////////////////
http.createServer(routes.dispatch).listen(PORT);
log.debug("Started courier on " + Date() + "\nListening on port " + PORT);
log.info("This server's URL is http://localhost:" + PORT + "/\nGlobals: routes, views\n\nAt your command.");

// Help our repl out.
repl.scope.routes = routes.routingTable;
repl.scope.views = require('views');
repl.start();
process.stdio.addListener("close", function() {
    log.info("Server shutting down.\nLeaving so soon?");
    process.exit(0);
  });
