var sb = require('switchboard');

exports.routingTable = {
  '': function(req, res) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("Welcome!\n");
      res.close();
    },

  'querydispatchtest': sb.dispatchQueryOverloadMega(
    ['a'],
    function(req, res, a) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("A is: " + a);
      res.close();
    },

    ['b', 'c'],
    function(req, res, b, c) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("B is: " + b + " and C is: " + c);
      res.close();
    },

    [],
    function(req, res) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("Nothing at all?\n");
      res.close();
    }),

  'test': {
    'a': function(req, res) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("Test A");
        res.close();
      },
    'b': function(req, res) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("Test B");
        res.close();
      },
    "": function(req, res) {
        res.writeHeader(200, {"Content-Type": "text/plain"});
        res.write("Test D+");
        res.close();
      }
  }
};
