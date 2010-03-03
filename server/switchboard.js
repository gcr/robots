// Switchboard: Handles handing off requests
var switchboard = exports,
    sys = require('sys');

switchboard.notFound = function(req, res) {
  res.writeHeader(404, {"Content-Type": "text/plain"});
  res.write("Not found");
  res.close();
  sys.puts("/!\\ URL not found: " + sys.inspect(req));
  return false;
};

// Dispatch a request into a series of paths.
// Use it thusly: switchboard.dispatch(req, res, path, {
//      'somedir': function(req, res) {...},
//      'dir2': {
//          'subdir': function() {...},
//          'something': function() {...}
//        },
//      'dir3': ...
//  }
switchboard.dispatch = function(req, res, path, routingTable) {
  var pname;
  if (typeof routingTable == 'function') {
    return routingTable(req, res, path);
  }
  // Convert path into an array.
  if (typeof path == 'string') {
    path = path.split('/');
  }
  if (path.length) {
    pname = path.shift();
  } else {
    // guess we couldn't find it... BUT WAIT! As a special case, see if it's
    // in the table.
    if ('' in routingTable) {
        return routingTable[''](req, res);
    }
    return switchboard.notFound(req,res);
  }

  if (pname == '') {
    // Oops, the client asked for a path like http://host//, but we don't know
    // how to serve that.
    return switchboard.dispatch(req, res, path, routingTable);
  }

  // Loop through the routing table, finding the proper function to use.
  for (var entry in routingTable) { if (routingTable.hasOwnProperty(entry)) {
    if (entry instanceof RegExp? entry.test(pname) : entry === pname) {
      // Just a string
      return switchboard.dispatch(
        req, res, path, routingTable[entry]);
    }
  }}

  // Didn't find any? OHNOES
  return switchboard.notFound(req, res);

};
