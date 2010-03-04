// views.js -- almost exclusively called by routes.js, views.js describes how
//             to render requests that we grab, except without all the
//             neckties.

var
  switchboard = require('switchboard');

exports.renderJson = function(req, res, obj) {
  var json = JSON.stringify(obj) + "\n";
  res.writeHeader(200, {"Content-Type": "text/plain",
                        "Content-Length": json.length});
  res.write(json);
  res.close();
};

// Want to just plug something into your switchboard and be off straightaway?
exports.respondWith = function(obj) {
  return function(req, res) {
    exports.renderJson(req, res, obj);
  };
};

// This renders a history object.
exports.renderHistory = function(hist) {
  return switchboard.dispatchQueryOverloadMega(
    // call it like http://whatever/history/?since=...
    ['since'],
    function(req, res, since) {
    hist.after(since, function(actions) {
      exports.renderJson(req, res, actions);
      });
    },

    // else just do http://whatever/...
    [],
    function(req, res) {
      exports.renderJson(req, res, hist.time());
    }
  );
};
