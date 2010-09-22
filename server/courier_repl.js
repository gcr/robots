var
  repl        = require('repl'),
  ears        = require('./ears'),
  site        = require('./views/site'),
  log         = require('./log');

function start(mlist) {
  // Help our repl out.

  /* broken in current node
  repl.scope.routes = site.routes;
  repl.scope.site = site;
  repl.scope.mlist = mlist;
  repl.scope.matches = mlist.matches;
  repl.scope.sys = require('sys');
  */

  repl.prompt = '\n';
  repl.start();
  repl.prompt = '\nnode> ';
  /*process.stdio.addListener("close",
    function() {
      log.info("Server shutting down.\nLeaving so soon?");
      process.exit(0);
    });*/
  ears.listenFor(
    {'MatchList':
      {'newMatch':
        function (mlist, match) {
          repl.scope.newMatch = match;
        }
      },

    'GameLogic':
      {'connectedRobot':
        function (game, robotId, robot) {
          repl.scope.newBot = robot;
        }
      }
    }
  );
}

exports.start = start;
