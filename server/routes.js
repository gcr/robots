exports.routingTable = {
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
    "d+": function(req, res) {
      res.writeHeader(200, {"Content-Type": "text/plain"});
      res.write("Test D+");
      res.close();
    }
  }
};
