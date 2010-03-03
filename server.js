var sys         = require('sys'),
    http        = require('http'),
    url         = require('url'),
    switchboard = require('./server/switchboard'),
    routes      = require('./server/routes');

http.createServer(function (req, res) {
    switchboard.dispatch(req,
      res,
      url.parse(req.url).pathname,
      routes.routingTable);
}).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');

