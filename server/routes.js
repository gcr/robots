// routes.js -- what should go where and when. Which parts of the code should
//              handle which URLs
var
  sb     = require('switchboard'),
  log    = require('log'),
  views  = require('views'),
  url    = require('url'),
  routes = exports;

exports.routingTable = {
  // Default page.
  // http://localhost:8080/
  '': function(req, res) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("Welcome!\n");
      res.close();
    },

  'jsontest': views.respondWith({"Foo": 25}),

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
        res.write("Test D+");
        res.close();
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

};


// Use this function to do things from our HTTP server.
routes.dispatch = function(req, res) {
  sb.dispatch(req, res,
    url.parse(req.url).pathname,
    routes.routingTable);
};
