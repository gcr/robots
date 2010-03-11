var
  http        = require('http'),
  log         = require('./server/log'),
  site        = require('./server/views/site'),
  ears        = require('./server/ears'),
  matchlist   = require('./server/matchlist'),
  repl        = require('./server/courier_repl'),
  PORT        = 8080;


////////////////////////////////////////////////////
// Make a match list
var mlist = new matchlist.MatchList();

// this function adds all the URLs and whatever else we need.
site.genMatchListSite(mlist);
log.beginLogging();

// Begin our repl
repl.start(mlist);

// Add all the ears you need above this line
ears.shout('Server', 'newMatchList', mlist);
http.createServer(site.dispatch).listen(PORT);
log.debug("Started courier on " + Date() + "\nListening on port " + PORT);
log.info("This server's URL is http://localhost:" + PORT + "/\nGlobals: routes, site, mlist, matches, sys\n\nAt your command.");

