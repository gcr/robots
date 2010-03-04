require.paths.push("./server");
var
  sys         = require('sys'),
  http        = require('http'),
  routes      = require('routes'),
  repl        = require('repl'),

  PORT        = 8080;


////////////////////////////////////////////////////
http.createServer(routes.dispatch).listen(PORT);
sys.puts('Server running at http://127.0.0.1:' + PORT + '/');

// Help our repl out.
repl.scope.routes = routes.routingTable;
repl.scope.views = require('views');
repl.start();
process.stdio.addListener("close", function() {
    sys.puts("\nLeaving so soon?");
    process.exit(0);
  });
