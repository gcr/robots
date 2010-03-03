// Switchboard: Handles handing off requests
var switchboard = exports,
    sys = require('sys'),
    assert = require('assert'),
    url = require('url');

switchboard.notFound = function(req, res) {
  res.writeHeader(404, {"Content-Type": "text/plain"});
  res.write("Not found");
  res.close();
  sys.puts("/!\\ URL not found: " + req.url);
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
    // in the table anyway.
    if ('' in routingTable) {
        return routingTable[''](req, res);
    }
    return switchboard.notFound(req,res);
  }

  if (pname == '') {
    // Oops, the client asked for a path like http://host// which is silly, so
    // we'll just try again and strip that blank path off.
    return switchboard.dispatch(req, res, path, routingTable);
  }

  // Loop through the routing table, finding the proper function to use.
  for (var entry in routingTable) { if (routingTable.hasOwnProperty(entry)) {
    if (entry == pname) {
      // Ha! Found it. Send it on down the tubes.
      return switchboard.dispatch(
        req, res, path, routingTable[entry]);
    }
  }}

  // Didn't find any? OHNOES
  return switchboard.notFound(req, res);

};

// Dispatch a request based on signatures into query strings sorta like method
// overloading except for JavaScript. Kinda insane. I don't know who wrote this,
// don't ask me.
// queryOverload(
//    ['a', 'b', 'c'],
//    function (req, res, a, b, c) {...},
//    ['a'],
//    function (req, res, a) {...},
//    [],
//    function (req, res) {...});
//  will run the second function with a as the argument if you do http://.../something?a=somethingelse
//  or the first if you do http://.../something?a=something&b=something&c=t
//  or the last if you do http://.../something with no queries. Protip: Be sure
//  to keep that default case at the end there!
switchboard.dispatchQueryOverloadMega = function() {
  function extractParams(query, sig) {
    // Returns an array that contains all the properties in query from all the
    // slots in sig. Or undefined if there's a mismatch. "Is sig a subset of
    // query?"
    // extractParams({'foo': 1, 'bar': 2, 'baz': 3}, ['bar', 'baz']) => [1, 3]
    // extractParams({'a': 1, 'b': 2}, ['c']) => undefined
    var result = [];
    for (var i=0,l=sig.length; i<l; i++) {
      if (!(sig[i] in query)) {
        return undefined;
      }
      result.push(query[sig[i]]);
    }
    return result;
  }
  // now, back to your originally scheduled program...
  assert.equal(arguments.length % 2, 0, "You must have one function for every signature.");
  var declarations = arguments;
  return function(req, res) {
    var sig, fun, args, query = url.parse(req.url, true).query || {};
    // Which function do we dispatch to?
    for (var i=0, l=declarations.length; i<l; i+=2) {
      sig = declarations[i];
      fun = declarations[i+1];
      // Are all the elements of sig in req.queryargs?
      args = extractParams(query, sig);
      if (args !== undefined) {
        // Ha! Found the method signature. Now send 'er straight on through.
        return fun.apply(req, [req, res].concat(args));
      }
    }

    // Nothing found?
    return switchboard.notFound(req, res);
  };
};

