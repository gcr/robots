// views.js -- almost exclusively called by routes.js, views.js describes how
//             to render requests that we grab, except without all the
//             neckties.

var
  switchboard = require('switchboard'),
  views       = exports;

views.renderJson = function(req, res, obj) {
  var json = JSON.stringify(obj) + "\n";
  res.writeHeader(200, {"Content-Type": "text/plain",
                        "Content-Length": json.length});
  res.write(json);
  res.close();
};

// Want to just plug something into your switchboard and be off straightaway?
views.respondWith = function(obj) {
  return function(req, res) {
    views.renderJson(req, res, obj);
  };
};

// This renders a history object.
views.renderHistory = function(hist) {
  return switchboard.dispatchQueryOverloadMega(
    // call it like http://whatever/history/?since=...
    ['since'],
    function(req, res, since) {
    hist.after(since, function(actions) {
      views.renderJson(req, res, actions);
      });
    },

    // else just do http://whatever/...
    [],
    function(req, res) {
      // we can't just do views.respondWith here because that would always
      // return 0 -- we've already evaluated hist.time()
      views.renderJson(req, res, hist.time());
    }
  );
};
