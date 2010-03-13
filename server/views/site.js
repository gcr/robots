// site.js -- almost exclusively called by server.js, site.js describes how
//             to render requests that we grab, except without all the
//             neckties that come in a normal enterprise-y URL dispatch system.
var
  url           = require('url'),
  switchboard   = require('./switchboard'),
  matchViews    = require('./match_list_views'),
  renderJson    = require('./view_helpers').renderJson,
  renderError   = require('./view_helpers').renderError,
  log           = require('../log'),
  staticFiles   = require('./static'),
  routes        = {};

function addRoutes(newRoutes) {
  return process.mixin(routes, newRoutes);
}


// Which match list will we do? (set from server.js)
function genMatchListSite(matches) {

  /////// ROUTING TABLE ///////
  return addRoutes({
    // Default page.
    // http://localhost:8080/
    '': staticFiles.makeFileServer("server/static/index.htm"),
    'css': staticFiles.makeFileServer("server/static/css"),
    'js': staticFiles.makeFileServer("server/static/js"),

    'matches': matchViews.makeMatchListViews(matches)

  }); // end addRoutes

} // end function


// Use this function to do things from our HTTP server.
function dispatch(req, res) {
  try {
    switchboard.dispatch(req, res,
      url.parse(req.url).pathname,
      routes);
  } catch(err) {
    return renderError(req, res, err);
  }
}

process.mixin(exports,
  {
    routes: routes,
    addRoutes: addRoutes,
    dispatch: dispatch,
    genMatchListSite: genMatchListSite
  }
);
