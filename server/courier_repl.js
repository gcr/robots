var
  repl        = require('repl'),
  ears        = require('./ears'),
  site        = require('./views/site'),
  log         = require('./log');

function start(mlist) {
  // Help our repl out.

  process.mixin(repl.scope,
    {
      'routes': site.routes,
      'site': site,
      'mlist': mlist,
      'matches': mlist.matches,
      'sys': require('sys')
    }
  );

  repl.prompt = '';
  repl.start();
  repl.prompt = 'node> ';
  process.stdio.addListener("close",
    function() {
      log.info("Server shutting down.\nLeaving so soon?");
      process.exit(0);
    });
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

process.mixin(exports,
  {
    'start': start
  }
);
