// utils.js -- extra utilities
var 
  switchboard = require('./switchboard'),
  url         = require('url'),
  sys         = require('sys'),
  log         = require('../log');

// Auxilary functions
function renderJson(req, res, obj) {
  var json;
  var query = url.parse(req.url, true).query || {};
  if (typeof obj == 'undefined') {
    json = JSON.stringify(null);
  } else {
    json = JSON.stringify(obj);
  }
  if ('jsonp' in query || 'callback' in query) {
      json = (query.jsonp || query.callback) + "(" + json + ")\n";
  } else {
    json = json + "\n";
  }
  res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8",
                                        // todo: change to text/json
                        "Content-Length": json.length});
  res.end(json);
}

// Want to just plug something into your switchboard and be off straightaway?
function makeJsonRenderer(obj) {
  return function(req, res) {
    renderJson(req, res, obj);
  };
}

function renderError(req, res, err) {
  log.error("URL: " + req.url + "\n\n" + (err.stack || sys.inspect(err)));
  renderJson(req, res, {'exception': err.message || err});
}

// This renders a history object.
function renderHistory(req, res, hist) {
  return switchboard.dispatchQueryOverload(req, res,
    // call it like http://whatever/history/?since=...
    ['since'],
    function(req, res, since) {
      hist.after(since, function(actions) {
        renderJson(req, res, actions);
      });
    },

    // else just do http://whatever/...
    [],
    function(req, res) {
      // we can't just do switchboard.respondWith here because that would always
      // return 0 -- we've already evaluated hist.time()
      renderJson(req, res, hist.time());
    }
  );
}

function makeHistoryRenderer(hist) {
  return function(req, res) {
    return renderHistory(req, res, hist);
  };
}

function randChoice(arr) {
  // Return something random out of us
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildUuid(size) {
  // Builds a unique string of length size
  var result = [];
  for (var i=0; i<size; i++) {
    result.push(randChoice("bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ0123456789"));
  }
  return result.join("");
}

function booleanize(m) {
  if (typeof m == 'string') {
    return (["", "n", "nil", "null", "undefined", "no", "f", "false"].indexOf(m.toLowerCase()) != -1);
  } else {
    return Boolean(m);
  }
}

exports.renderJson = renderJson;
exports.renderError = renderError;
exports.makeJsonRenderer = makeJsonRenderer;
exports.renderHistory = renderHistory;
exports.buildUuid = buildUuid;
exports.randChoice = randChoice;
exports.booleanize = booleanize;
exports.makeHistoryRenderer = makeHistoryRenderer;
