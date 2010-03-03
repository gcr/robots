// Switchboard: Handles handing off requests
var switchboard = exports,
    sys = require('sys');

switchboard.notFound = function(req, res) {
  res.writeHeader(404, {"Content-Type": "text/plain"});
  res.write("Not found");
  res.close();
  sys.puts("/!\\ URL not found: " + req.url);
  return false;
};

switchboard.dispatch = function(req, res, path, routingTable, pname) {
  // Dispatch a request into a series of paths.
  if (typeof routingTable == 'function') {
    return routingTable(req, res, path, pname);
  }
  // Convert path into an array.
  if (typeof path == 'string') {
    path = path.split('/');
  }
  if (path.length) {
    pname = path.shift();
  } else {
    return switchboard.notFound(req,res);
  }

  if (pname == '') {
    // Oops, the client asked for a path like http://host//
    return switchboard.dispatch(req, res, path, routingTable);
  }

  // Loop through the routing table, finding the proper function to use.
  for (var entry in routingTable) {
    if (entry instanceof RegExp? entry.test(pname) : entry == pname) {
      // Just a string
      return switchboard.dispatch(
        req, res, path, routingTable[entry], pname);
    }
  }
  // Didn't find any? OHNOES
  sys.puts("Uh oh, we fell out of the back! " + pname + sys.inspect(routingTable));
  return switchboard.notFound(req, res);

};
