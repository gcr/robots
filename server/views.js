// views.js -- almost exclusively called by routes.js, views.js describes how
//             to render requests that we grab, except without all the
//             neckties.

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
