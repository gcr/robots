// utils.js -- extra utilities
var 
  switchboard = require('switchboard');

// Auxilary functions
function renderJson(req, res, obj) {
  var json = JSON.stringify(obj) + "\n";
  res.writeHeader(200, {"Content-Type": "text/plain",
                        "Content-Length": json.length});
  res.write(json);
  res.close();
}

// Want to just plug something into your switchboard and be off straightaway?
function respondWith(obj) {
  return function(req, res) {
    renderJson(req, res, obj);
  };
}

// This renders a history object.
function renderHistory(hist) {
  return switchboard.dispatchQueryOverloadMega(
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
      // we can't just do views.respondWith here because that would always
      // return 0 -- we've already evaluated hist.time()
      renderJson(req, res, hist.time());
    }
  );
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
    return (["", "n", "nil", "null", "undefined", "no"].indexOf(m.toLowerCase()) != -1);
  } else {
    return Boolean(m);
  }
}

process.mixin(exports,
  {
    renderJson: renderJson,
    respondWith: respondWith,
    renderHistory: renderHistory,
    buildUuid: buildUuid,
    randChoice: randChoice,
    booleanize: booleanize
  }
);
